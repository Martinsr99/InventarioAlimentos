import { db, auth } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { PredefinedProduct } from './PredefinedProductsService';

interface UserProduct {
  name: string;
  category: string;
  userId: string;
}

export const addUserProduct = async (product: { name: string; category: string }): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    // Get all user products to check for duplicates
    const q = query(
      collection(db, 'userProducts'),
      where('userId', '==', auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    
    // Check if product already exists (case-insensitive)
    const exists = querySnapshot.docs.some(doc => 
      doc.data().name.toLowerCase().trim() === product.name.toLowerCase().trim()
    );

    // Only add if it doesn't exist
    if (!exists) {
      const newProduct = {
        ...product,
        userId: auth.currentUser.uid,
        name: product.name.trim(),
        category: product.category
      };
      await addDoc(collection(db, 'userProducts'), newProduct);
    }
  } catch (error) {
    console.error('Error adding user product:', error);
    throw error;
  }
};

export const getUserProducts = async (): Promise<PredefinedProduct[]> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    // Query user products by userId only
    const q = query(
      collection(db, 'userProducts'),
      where('userId', '==', auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      name: doc.data().name,
      category: doc.data().category
    }));
  } catch (error) {
    console.error('Error getting user products:', error);
    throw error;
  }
};

export const deleteUserProduct = async (productName: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    const q = query(
      collection(db, 'userProducts'),
      where('userId', '==', auth.currentUser.uid),
      where('name', '==', productName)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await deleteDoc(docRef);
    }
  } catch (error) {
    console.error('Error deleting user product:', error);
    throw error;
  }
};

// Helper function to search user products (used by PredefinedProductsService)
export const searchUserProducts = async (query: string): Promise<PredefinedProduct[]> => {
  try {
    const products = await getUserProducts();
    const searchQuery = query.toLowerCase().trim();
    
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery)
    );
  } catch (error) {
    console.error('Error searching user products:', error);
    return [];
  }
};
