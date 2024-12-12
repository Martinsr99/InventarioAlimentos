import { addProduct } from './InventoryService';
import { addUserProduct } from './UserProductsService';
import { searchPredefinedProducts } from './PredefinedProductsService';

interface ProductFormData {
  name: string;
  expiryDate: string;
  quantity: number;
  location: string;
  notes: string;
  category?: string;
  sharedWith: string[];
}

export const submitProductForm = async (formData: ProductFormData, language: string): Promise<void> => {
  try {
    // First save the product to inventory
    await addProduct({
      name: formData.name.trim(),
      expiryDate: formData.expiryDate,
      quantity: Number(formData.quantity),
      location: formData.location,
      notes: formData.notes.trim(),
      ...(formData.category ? { category: formData.category } : {}),
      sharedWith: formData.sharedWith
    });

    // If the product has a name and category, check if it's a custom product
    if (formData.name && formData.category) {
      // Search for the product in predefined products
      const predefinedProducts = await searchPredefinedProducts(formData.name, language);
      
      const exactMatch = predefinedProducts.find(p => 
        p.name.toLowerCase() === formData.name.trim().toLowerCase()
      );

      // If it's not a predefined product, save it as a custom product
      if (!exactMatch) {
        await addUserProduct({
          name: formData.name.trim(),
          category: formData.category
        }, language);
      }
    }
  } catch (error) {
    console.error('Error submitting product form:', error);
    throw error;
  }
};
