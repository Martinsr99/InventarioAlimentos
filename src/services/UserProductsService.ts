import { db, auth } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { PredefinedProduct } from './PredefinedProductsService';

interface UserProduct {
  name: string;
  category: string;
  userId: string;
  language: string;
}

export const addUserProduct = async (product: { name: string; category: string }, language: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    // Get all user products to check for duplicates
    const q = query(
      collection(db, 'userProducts'),
      where('userId', '==', auth.currentUser.uid),
      where('language', '==', language)
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
        language,
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

export const getUserProducts = async (language: string): Promise<PredefinedProduct[]> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    // Query user products by userId and language
    const q = query(
      collection(db, 'userProducts'),
      where('userId', '==', auth.currentUser.uid),
      where('language', '==', language)
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

// Helper function to search user products (used by PredefinedProductsService)
export const searchUserProducts = async (query: string, language: string): Promise<PredefinedProduct[]> => {
  try {
    const products = await getUserProducts(language);
    const searchQuery = query.toLowerCase().trim();
    
    return products.filter(product => 
      product.name.toLowerCase().includes(searchQuery)
    );
  } catch (error) {
    console.error('Error searching user products:', error);
    return [];
  }
};
