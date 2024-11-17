import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

export interface Product {
  id: string;
  name: string;
  expiryDate: string;
  location: string;
  quantity: number;
  category?: string;
  notes: string; // Changed from optional to required
  userId: string;
  addedAt: string;
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
      ...doc.data(),
      notes: doc.data().notes || '' // Ensure notes is always a string
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
      notes: product.notes || '', // Ensure notes is always a string
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
    const updatedData = {
      ...updates,
      notes: updates.notes || '' // Ensure notes is always a string
    };
    await updateDoc(productRef, updatedData);
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
