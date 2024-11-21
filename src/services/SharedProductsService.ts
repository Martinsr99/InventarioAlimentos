import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Product } from './InventoryService';

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

export const sendShareInvitation = async (currentUser: User, toUserEmail: string): Promise<void> => {
  if (!currentUser?.email || !currentUser?.uid) {
    throw new Error('No authenticated user');
  }

  const invitationData = {
    fromUserId: currentUser.uid,
    fromUserEmail: currentUser.email,
    toUserEmail: toUserEmail,
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };

  await addDoc(collection(db, 'shareInvitations'), invitationData);
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
    console.log('No received invitations found');
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
    console.log('No sent invitations found');
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
        console.log('Error getting products for invitation, skipping...');
        continue;
      }
    }

    return sharedProducts;
  } catch (error) {
    console.log('No shared products found');
    return [];
  }
};
