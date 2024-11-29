import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import { ProductCategory, ProductLocation } from '../constants/productConstants';

interface UpdateProductData {
  name: string;
  expiryDate: string;
  quantity: number;
  location: ProductLocation;
  notes: string;
  category: ProductCategory | '';
  sharedWith: string[];
}

export const updateProduct = async (productId: string, data: UpdateProductData): Promise<void> => {
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, {
    ...data,
    updatedAt: new Date().toISOString()
  });
};
