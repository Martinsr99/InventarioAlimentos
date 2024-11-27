import { updateProduct } from './InventoryService';
import { ProductCategory, ProductLocation } from '../constants/productConstants';

interface EditProductData {
  name: string;
  expiryDate: string;
  quantity: number;
  location: ProductLocation;
  notes: string;
  category?: ProductCategory;
  sharedWith: string[];
}

export const submitProductEdit = async (productId: string, formData: EditProductData): Promise<void> => {
  try {
    await updateProduct(productId, {
      name: formData.name.trim(),
      expiryDate: formData.expiryDate,
      quantity: Number(formData.quantity),
      location: formData.location,
      notes: formData.notes.trim(),
      ...(formData.category ? { category: formData.category } : {}),
      sharedWith: formData.sharedWith
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};
