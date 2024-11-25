import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, setDoc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Product } from './InventoryService';
import { sendShareInvitationNotification } from './NotificationService';

export interface ShareInvitation {
  id: string;
  fromUserId: string;
  fromUserEmail: string;
  toUserEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export const initializeUserSharing = async (user: User): Promise<void> => {
  if (!user?.uid) return;

  try {
    const userSharingRef = doc(db, 'userSharing', user.uid);
    await setDoc(userSharingRef, {
      userId: user.uid,
      email: user.email,
      sharedWith: [],
      createdAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.log('Error initializing user sharing:', error);
  }
};

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

export const getAcceptedShareUsers = async (currentUser: User): Promise<{ userId: string; email: string }[]> => {
  if (!currentUser?.email) return [];

  try {
    const invitationsQuery = query(
      collection(db, 'shareInvitations'),
      where('fromUserEmail', '==', currentUser.email),
      where('status', '==', 'accepted')
    );
    
    const querySnapshot = await getDocs(invitationsQuery);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: data.toUserId,
        email: data.toUserEmail
      };
    });
  } catch (error) {
    return [];
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

export const getReceivedInvitations = async (currentUser: User): Promise<ShareInvitation[]> => {
  if (!currentUser?.email) return [];

  try {
    const invitationsQuery = query(
      collection(db, 'shareInvitations'),
      where('toUserEmail', '==', currentUser.email),
      where('status', '==', 'pending')
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

export const respondToInvitation = async (
  currentUser: User,
  invitationId: string,
  response: 'accepted' | 'rejected'
): Promise<void> => {
  if (!currentUser?.email) {
    throw new Error('No authenticated user');
  }

  const invitationRef = doc(db, 'shareInvitations', invitationId);
  await updateDoc(invitationRef, { status: response });
};

export const deleteInvitation = async (
  currentUser: User,
  invitationId: string
): Promise<void> => {
  if (!currentUser?.uid) {
    throw new Error('No authenticated user');
  }

  const invitationRef = doc(db, 'shareInvitations', invitationId);
  await deleteDoc(invitationRef);
};

export const getSharedProducts = async (currentUser: User): Promise<Product[]> => {
  if (!currentUser?.email) return [];

  try {
    const invitationsQuery = query(
      collection(db, 'shareInvitations'),
      where('toUserEmail', '==', currentUser.email),
      where('status', '==', 'accepted')
    );
    
    const invitationsSnapshot = await getDocs(invitationsQuery);
    if (invitationsSnapshot.empty) {
      return [];
    }

    const sharedProducts: Product[] = [];
    for (const invitationDoc of invitationsSnapshot.docs) {
      try {
        const invitation = invitationDoc.data() as ShareInvitation;
        const productsQuery = query(
          collection(db, 'products'),
          where('userId', '==', invitation.fromUserId)
        );
        
        const productsSnapshot = await getDocs(productsQuery);
        if (!productsSnapshot.empty) {
          sharedProducts.push(...productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            notes: doc.data().notes || '',
            sharedBy: invitation.fromUserEmail
          } as Product & { sharedBy: string })));
        }
      } catch (error) {
        continue;
      }
    }

    return sharedProducts;
  } catch (error) {
    return [];
  }
};

export const hasAcceptedInvitations = async (currentUser: User): Promise<boolean> => {
  if (!currentUser?.email) return false;

  try {
    const invitationsQuery = query(
      collection(db, 'shareInvitations'),
      where('toUserEmail', '==', currentUser.email),
      where('status', '==', 'accepted')
    );
    
    const querySnapshot = await getDocs(invitationsQuery);
    return !querySnapshot.empty;
  } catch (error) {
    return false;
  }
};
