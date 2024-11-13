import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

export interface Product {
  id: string;
  name: string;
  expiryDate: string;
  location: string;
  addedAt: string;
  quantity: number;
  category: string;
  notes?: string;
  userId: string;
}

export const getProducts = async (): Promise<Product[]> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    const q = query(
      collection(db, 'products'),
      where('userId', '==', auth.currentUser.uid)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Product));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

export const addProduct = async (product: Omit<Product, 'id' | 'userId' | 'addedAt'>): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      addedAt: new Date().toISOString(),
      userId: auth.currentUser.uid
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (productId: string, updates: Partial<Omit<Product, 'id' | 'userId' | 'addedAt'>>): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, updates);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};
