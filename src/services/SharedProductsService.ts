import { db } from '../firebaseConfig';
import { collection, getDocs, doc, query, where, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { Product } from './InventoryService';
import { UserSharing } from './types';

export const getSharedProducts = async (currentUser: User): Promise<Product[]> => {
  if (!currentUser?.email || !currentUser?.uid) return [];

  try {
    const sharedProducts: Product[] = [];

    // Get products shared with me
    const sharedWithMeQuery = query(
      collection(db, 'products'),
      where('sharedWith', 'array-contains', currentUser.uid)
    );
    
    const sharedWithMeSnapshot = await getDocs(sharedWithMeQuery);
    
    // Process shared products
    for (const productDoc of sharedWithMeSnapshot.docs) {
      const productData = productDoc.data();
      const ownerDoc = await getDoc(doc(db, 'userSharing', productData.userId));
      const ownerData = ownerDoc.data() as UserSharing | undefined;
      const ownerEmail = ownerData?.email || '';
      
      sharedProducts.push({
        id: productDoc.id,
        ...productData,
        notes: productData.notes || '',
        sharedBy: ownerEmail,
        isOwner: productData.userId === currentUser.uid
      } as Product & { sharedBy: string; isOwner: boolean });
    }

    // Get user's own shared products
    const ownProductsQuery = query(
      collection(db, 'products'),
      where('userId', '==', currentUser.uid),
      where('sharedWith', '!=', [])
    );
    
    const ownProductsSnapshot = await getDocs(ownProductsQuery);
    if (!ownProductsSnapshot.empty) {
      sharedProducts.push(...ownProductsSnapshot.docs
        .filter(doc => !sharedProducts.some(p => p.id === doc.id)) // Evitar duplicados
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          notes: doc.data().notes || '',
          sharedBy: currentUser.email,
          isOwner: true
        } as Product & { sharedBy: string; isOwner: boolean })));
    }

    return sharedProducts;
  } catch (error) {
    console.error('Error getting shared products:', error);
    if (error instanceof Error && error.message.includes('requires an index')) {
      console.error(`
        Please create the following indices in Firebase Console:
        1. Collection: products
           Fields to index: 
           - sharedWith (Array)
           - __name__ (Ascending)
        
        2. Collection: products
           Fields to index:
           - userId (Ascending)
           - sharedWith (Array)
           - __name__ (Ascending)
        
        You can create them by visiting the URL in the error message above.
      `);
    }
    return [];
  }
};
