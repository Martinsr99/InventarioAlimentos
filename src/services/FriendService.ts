import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { UserSharing } from './types';

export const initializeUserSharing = async (user: User): Promise<void> => {
  if (!user?.uid) return;

  try {
    const userSharingRef = doc(db, 'userSharing', user.uid);
    const userSharingDoc = await getDoc(userSharingRef);
    
    if (!userSharingDoc.exists()) {
      await setDoc(userSharingRef, {
        userId: user.uid,
        email: user.email,
        sharedWith: [],
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.log('Error initializing user sharing:', error);
  }
};

export const getAcceptedShareUsers = async (currentUser: User): Promise<{ userId: string; email: string }[]> => {
  if (!currentUser?.email) return [];

  try {
    // Get the current user's userSharing document
    const userSharingRef = doc(db, 'userSharing', currentUser.uid);
    const userSharingDoc = await getDoc(userSharingRef);
    
    if (!userSharingDoc.exists()) {
      return [];
    }

    const userData = userSharingDoc.data() as UserSharing;
    return userData.sharedWith || [];
  } catch (error) {
    console.error('Error getting accepted share users:', error);
    return [];
  }
};

export const deleteFriend = async (currentUser: User, friendUserId: string): Promise<void> => {
  if (!currentUser?.uid) {
    throw new Error('No authenticated user');
  }

  try {
    // Get both users' sharing documents
    const [friendDoc, currentUserDoc] = await Promise.all([
      getDoc(doc(db, 'userSharing', friendUserId)),
      getDoc(doc(db, 'userSharing', currentUser.uid))
    ]);

    if (!friendDoc.exists() || !currentUserDoc.exists()) {
      throw new Error('Friend not found');
    }

    const friendData = friendDoc.data() as UserSharing;
    const currentUserData = currentUserDoc.data() as UserSharing;

    // Prepare updates for both users
    const updates: Promise<void>[] = [];

    // Update current user's userSharing
    const updatedCurrentUserSharedWith = currentUserData.sharedWith.filter(
      user => user.userId !== friendUserId
    );
    updates.push(updateDoc(doc(db, 'userSharing', currentUser.uid), {
      sharedWith: updatedCurrentUserSharedWith
    }));

    // Update friend's userSharing
    const updatedFriendSharedWith = friendData.sharedWith.filter(
      user => user.userId !== currentUser.uid
    );
    updates.push(updateDoc(doc(db, 'userSharing', friendUserId), {
      sharedWith: updatedFriendSharedWith
    }));

    // Delete the accepted invitation
    const invitationsQuery = query(
      collection(db, 'shareInvitations'),
      where('status', '==', 'accepted'),
      where('fromUserId', 'in', [currentUser.uid, friendUserId]),
      where('toUserId', 'in', [currentUser.uid, friendUserId])
    );
    
    const invitationsSnapshot = await getDocs(invitationsQuery);
    updates.push(...invitationsSnapshot.docs.map(doc => deleteDoc(doc.ref)));

    // Execute all updates atomically
    await Promise.all(updates);

  } catch (error) {
    console.error('Error deleting friend:', error);
    throw error;
  }
};
