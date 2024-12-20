import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, writeBatch, addDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface DeletedProduct {
  name: string;
  expiryDate: string;
  deletedAt: string;
}

export const checkAndDeleteExpiredProducts = async (user: User): Promise<DeletedProduct[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const productsRef = collection(db, 'products');
    const q = query(
      productsRef,
      where('userId', '==', user.uid),
      where('expiryDate', '<', today)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return [];
    }

    const batch = writeBatch(db);
    const deletedProducts: DeletedProduct[] = [];

    // Collect products to delete
    querySnapshot.docs.forEach(doc => {
      const product = doc.data();
      batch.delete(doc.ref);
      deletedProducts.push({
        name: product.name,
        expiryDate: product.expiryDate,
        deletedAt: new Date().toISOString()
      });
    });

    // Store deletion record
    if (deletedProducts.length > 0) {
      await addDoc(collection(db, 'deletedProducts'), {
        userId: user.uid,
        products: deletedProducts,
        deletedAt: new Date().toISOString()
      });
    }

    // Execute all deletions
    await batch.commit();

    return deletedProducts;
  } catch (error) {
    console.error('Error checking and deleting expired products:', error);
    return [];
  }
};

export const getLastDeletedProducts = async (user: User): Promise<DeletedProduct[]> => {
  try {
    const q = query(
      collection(db, 'deletedProducts'),
      where('userId', '==', user.uid)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return [];
    }

    // Get the most recent deletion record
    const sortedDocs = querySnapshot.docs.sort(
      (a, b) => new Date(b.data().deletedAt).getTime() - new Date(a.data().deletedAt).getTime()
    );
    
    return sortedDocs[0].data().products;
  } catch (error) {
    console.error('Error getting last deleted products:', error);
    return [];
  }
};
