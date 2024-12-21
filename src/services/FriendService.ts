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
        createdAt: new Date().toISOString(),
        invitationId: null
      });
    }
  } catch (error) {
    console.log('Error initializing user sharing:', error);
  }
};

export const getAcceptedShareUsers = async (currentUser: User | null): Promise<{ userId: string; email: string }[]> => {
  // Return empty array if no user or no email (including after sign out)
  if (!currentUser?.email || !currentUser?.uid) {
    return [];
  }

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
    // Silently return empty array on permission errors (which occur after sign out)
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      return [];
    }
    console.error('Error getting accepted share users:', error);
    return [];
  }
};

const BATCH_SIZE = 10; // Firestore allows up to 10 items in 'in' clauses

export const deleteFriends = async (currentUser: User, friendUserIds: string[]): Promise<void> => {
  if (!currentUser?.uid) {
    throw new Error('No authenticated user');
  }

  try {
    // Process friends in batches
    for (let i = 0; i < friendUserIds.length; i += BATCH_SIZE) {
      const batch = friendUserIds.slice(i, i + BATCH_SIZE);
      await deleteFriendsBatch(currentUser, batch);
    }
  } catch (error) {
    console.error('Error deleting friends:', error);
    throw error;
  }
};

const deleteFriendsBatch = async (currentUser: User, friendUserIds: string[]): Promise<void> => {
  // Get all users' sharing documents
  const [currentUserDoc, ...friendDocs] = await Promise.all([
    getDoc(doc(db, 'userSharing', currentUser.uid)),
    ...friendUserIds.map(id => getDoc(doc(db, 'userSharing', id)))
  ]);

  if (!currentUserDoc.exists() || friendDocs.some(doc => !doc.exists())) {
    throw new Error('One or more friends not found');
  }

  const currentUserData = currentUserDoc.data() as UserSharing;
  const updates: Promise<void>[] = [];

  // Update current user's userSharing
  const updatedCurrentUserSharedWith = currentUserData.sharedWith.filter(
    user => !friendUserIds.includes(user.userId)
  );
  updates.push(updateDoc(doc(db, 'userSharing', currentUser.uid), {
    sharedWith: updatedCurrentUserSharedWith,
    invitationId: null
  }));

  // Update each friend's userSharing
  friendDocs.forEach((friendDoc, index) => {
    const friendData = friendDoc.data() as UserSharing;
    const updatedFriendSharedWith = friendData.sharedWith.filter(
      user => user.userId !== currentUser.uid
    );
    updates.push(updateDoc(doc(db, 'userSharing', friendUserIds[index]), {
      sharedWith: updatedFriendSharedWith,
      invitationId: null
    }));
  });

  // Process invitations in batches
  const processInvitationsBatch = async (userIds: string[]) => {
    const invitationsQuery = query(
      collection(db, 'shareInvitations'),
      where('status', '==', 'accepted'),
      where('fromUserId', 'in', [currentUser.uid, ...userIds]),
      where('toUserId', 'in', [currentUser.uid, ...userIds])
    );
    
    const invitationsSnapshot = await getDocs(invitationsQuery);
    updates.push(...invitationsSnapshot.docs.map(doc => deleteDoc(doc.ref)));
  };

  // Process products in batches
  const processProductsBatch = async (userIds: string[]) => {
    // 1. Get all products where current user is involved (either as owner or shared)
    const productsQuery = query(
      collection(db, 'products'),
      where('sharedWith', 'array-contains', currentUser.uid)
    );
    const productsSnapshot = await getDocs(productsQuery);
    
    // Process products shared with current user
    productsSnapshot.docs.forEach(productDoc => {
      const productData = productDoc.data();
      if (friendUserIds.includes(productData.userId)) {
        // If product owner is being removed as friend, remove current user from sharedWith
        updates.push(updateDoc(doc(db, 'products', productDoc.id), {
          sharedWith: productData.sharedWith.filter((id: string) => id !== currentUser.uid),
          isShared: false
        }));
      }
    });

    // 2. Get all products owned by current user
    const ownedProductsQuery = query(
      collection(db, 'products'),
      where('userId', '==', currentUser.uid)
    );
    const ownedProductsSnapshot = await getDocs(ownedProductsQuery);
    
    // Process products owned by current user
    ownedProductsSnapshot.docs.forEach(productDoc => {
      const productData = productDoc.data();
      const updatedSharedWith = productData.sharedWith.filter(
        (userId: string) => !friendUserIds.includes(userId)
      );
      updates.push(updateDoc(doc(db, 'products', productDoc.id), {
        sharedWith: updatedSharedWith,
        isShared: updatedSharedWith.length > 0
      }));
    });

    // 3. Get all products owned by friends being removed
    const friendsProductsQuery = query(
      collection(db, 'products'),
      where('userId', 'in', friendUserIds)
    );
    const friendsProductsSnapshot = await getDocs(friendsProductsQuery);
    
    // Process products owned by removed friends
    friendsProductsSnapshot.docs.forEach(productDoc => {
      const productData = productDoc.data();
      if (productData.sharedWith.includes(currentUser.uid)) {
        updates.push(updateDoc(doc(db, 'products', productDoc.id), {
          sharedWith: productData.sharedWith.filter((id: string) => id !== currentUser.uid),
          isShared: productData.sharedWith.filter((id: string) => id !== currentUser.uid).length > 0
        }));
      }
    });
  };

  // Process invitations and products in batches
  for (let i = 0; i < friendUserIds.length; i += BATCH_SIZE) {
    const batch = friendUserIds.slice(i, i + BATCH_SIZE);
    await processInvitationsBatch(batch);
    await processProductsBatch(batch);
  }

  // Execute all updates
  await Promise.all(updates);
};
