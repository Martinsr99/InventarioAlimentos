import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { ShareInvitation, UserSharing } from './types';
import { sendShareInvitationNotification } from './NotificationService';
import { initializeUserSharing } from './FriendService';

const checkUserExists = async (email: string): Promise<{ exists: boolean; userId?: string }> => {
  try {
    // First try to find the user in userSettings
    const userSettingsQuery = query(
      collection(db, 'userSettings'),
      where('email', '==', email)
    );
    
    const userSettingsSnapshot = await getDocs(userSettingsQuery);
    if (!userSettingsSnapshot.empty) {
      return { exists: true, userId: userSettingsSnapshot.docs[0].id };
    }
    
    // If not found in userSettings, try userSharing
    const sharingsQuery = query(
      collection(db, 'userSharing'),
      where('email', '==', email)
    );
    
    const sharingsSnapshot = await getDocs(sharingsQuery);
    if (!sharingsSnapshot.empty) {
      return { exists: true, userId: sharingsSnapshot.docs[0].id };
    }
    
    // If not found in either collection, check if the email format is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { exists: false };
    }
    
    return { exists: true };
  } catch (error) {
    return { exists: false };
  }
};

export const sendShareInvitation = async (currentUser: User, toUserEmail: string): Promise<void> => {
  if (!currentUser?.email || !currentUser?.uid) {
    throw new Error('No authenticated user');
  }

  // Check if the target user exists
  const { exists, userId } = await checkUserExists(toUserEmail);
  if (!exists) {
    throw new Error('user_not_found');
  }

  // Check if an invitation already exists
  const existingInvitationsQuery = query(
    collection(db, 'shareInvitations'),
    where('fromUserId', '==', currentUser.uid),
    where('toUserEmail', '==', toUserEmail)
  );
  
  const existingInvitations = await getDocs(existingInvitationsQuery);
  if (!existingInvitations.empty) {
    throw new Error('invitation_exists');
  }

  const invitationData = {
    fromUserId: currentUser.uid,
    fromUserEmail: currentUser.email,
    toUserEmail: toUserEmail,
    toUserId: userId,
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };

  // Create the invitation
  const invitationRef = await addDoc(collection(db, 'shareInvitations'), invitationData);

  // Send notification and email
  try {
    if (userId) {
      await sendShareInvitationNotification(userId, currentUser);
    }
  } catch (error) {
    // Don't throw here - the invitation was created successfully
  }
};

export const respondToInvitation = async (
  currentUser: User,
  invitationId: string,
  response: 'accepted' | 'rejected'
): Promise<void> => {
  if (!currentUser?.email) {
    throw new Error('No authenticated user');
  }

  try {
    // First update the invitation status
    const invitationRef = doc(db, 'shareInvitations', invitationId);
    const invitationDoc = await getDoc(invitationRef);
    
    if (!invitationDoc.exists()) {
      throw new Error('Invitation not found');
    }

    const invitation = invitationDoc.data() as ShareInvitation;

    // Update invitation status and add toUserId if accepting
    const updateData: Partial<ShareInvitation> = {
      status: response,
      ...(response === 'accepted' ? { toUserId: currentUser.uid } : {})
    };
    await updateDoc(invitationRef, updateData);

    if (response === 'accepted') {
      // Initialize userSharing for both users
      await Promise.all([
        initializeUserSharing({ uid: invitation.fromUserId, email: invitation.fromUserEmail } as User),
        initializeUserSharing(currentUser)
      ]);

      try {
        // Update receiver's document first
        const receiverDoc = await getDoc(doc(db, 'userSharing', currentUser.uid));
        if (receiverDoc.exists()) {
          const receiverData = receiverDoc.data() as UserSharing;
          if (!receiverData.sharedWith.some(user => user.userId === invitation.fromUserId)) {
            try {
              // First update with invitationId to pass security rules
              await updateDoc(doc(db, 'userSharing', currentUser.uid), {
                invitationId
              });

              // Then update sharedWith array
              await updateDoc(doc(db, 'userSharing', currentUser.uid), {
                sharedWith: [...(receiverData.sharedWith || []), {
                  userId: invitation.fromUserId,
                  email: invitation.fromUserEmail
                }]
              });
            } catch (error) {
              // If any update fails, try to clean up
              try {
                await updateDoc(doc(db, 'userSharing', currentUser.uid), {
                  invitationId: null
                });
              } catch (cleanupError) {
                console.error('Error cleaning up after failed update:', cleanupError);
              }
              throw error;
            }
          }
        }

        // Then update sender's document
        const senderDoc = await getDoc(doc(db, 'userSharing', invitation.fromUserId));
        if (senderDoc.exists()) {
          const senderData = senderDoc.data() as UserSharing;
          if (!senderData.sharedWith.some(user => user.userId === currentUser.uid)) {
            try {
              // First update with invitationId to pass security rules
              await updateDoc(doc(db, 'userSharing', invitation.fromUserId), {
                invitationId
              });

              // Then update sharedWith array
              await updateDoc(doc(db, 'userSharing', invitation.fromUserId), {
                sharedWith: [...(senderData.sharedWith || []), {
                  userId: currentUser.uid,
                  email: currentUser.email
                }]
              });
            } catch (error) {
              // If any update fails, try to clean up
              try {
                await updateDoc(doc(db, 'userSharing', invitation.fromUserId), {
                  invitationId: null
                });
              } catch (cleanupError) {
                console.error('Error cleaning up after failed update:', cleanupError);
              }
              throw error;
            }
          }
        }
      } catch (error) {
        console.error('Error updating sharing documents:', error);
        throw new Error('Failed to update sharing documents');
      }
    }
  } catch (error) {
    console.error('Error responding to invitation:', error);
    throw error;
  }
};

export const getReceivedInvitations = async (currentUser: User): Promise<ShareInvitation[]> => {
  if (!currentUser?.email) return [];

  try {
    const invitationsQuery = query(
      collection(db, 'shareInvitations'),
      where('toUserEmail', '==', currentUser.email)
    );
    
    const querySnapshot = await getDocs(invitationsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ShareInvitation));
  } catch (error) {
    return [];
  }
};

export const getSentInvitations = async (currentUser: User): Promise<ShareInvitation[]> => {
  if (!currentUser?.uid) return [];

  try {
    const invitationsQuery = query(
      collection(db, 'shareInvitations'),
      where('fromUserId', '==', currentUser.uid)
    );
    
    const querySnapshot = await getDocs(invitationsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ShareInvitation));
  } catch (error) {
    return [];
  }
};

export const deleteInvitation = async (currentUser: User, invitationId: string): Promise<void> => {
  if (!currentUser?.uid) {
    throw new Error('No authenticated user');
  }

  const invitationRef = doc(db, 'shareInvitations', invitationId);
  await updateDoc(invitationRef, { status: 'rejected' });
};
