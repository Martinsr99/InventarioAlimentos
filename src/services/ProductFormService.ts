import { addProduct } from './InventoryService';

interface ProductFormData {
  name: string;
  expiryDate: string;
  quantity: number;
  location: string;
  notes: string;
  category?: string;
  sharedWith: string[];
}

export const submitProductForm = async (formData: ProductFormData): Promise<void> => {
  try {
    await addProduct({
      name: formData.name.trim(),
      expiryDate: formData.expiryDate,
      quantity: Number(formData.quantity),
      location: formData.location,
      notes: formData.notes.trim(),
      ...(formData.category ? { category: formData.category } : {}),
      sharedWith: formData.sharedWith
    });
  } catch (error) {
    console.error('Error submitting product form:', error);
    throw error;
  }
};
