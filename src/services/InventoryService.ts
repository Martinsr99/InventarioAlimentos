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
  notes: string;
  userId: string;
  addedAt: string;
  sharedWith?: string[];
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
      notes: doc.data().notes || '', // Ensure notes is always a string
      sharedWith: doc.data().sharedWith || [] // Ensure sharedWith is always an array
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
      sharedWith: product.sharedWith || [], // Ensure sharedWith is always an array
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
      notes: updates.notes || '', // Ensure notes is always a string
    };

    // Si se está actualizando sharedWith y no está vacío, asegurarse de que el propietario esté incluido
    if (updates.sharedWith && updates.sharedWith.length > 0) {
      const sharedWith = new Set(updates.sharedWith);
      sharedWith.add(auth.currentUser.uid); // Agregar al propietario al array
      updatedData.sharedWith = Array.from(sharedWith);
    } else {
      updatedData.sharedWith = [];
    }

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
