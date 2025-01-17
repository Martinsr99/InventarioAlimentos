import { addProduct, findExistingProduct, updateProduct } from './InventoryService';
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

interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingProduct?: {
    id: string;
    quantity: number;
  };
  totalQuantity?: number;
}

export const checkForDuplicateProduct = async (formData: ProductFormData): Promise<DuplicateCheckResult> => {
  const existingProduct = await findExistingProduct(formData.name);
  
  if (existingProduct) {
    return {
      isDuplicate: true,
      existingProduct: {
        id: existingProduct.id,
        quantity: existingProduct.quantity
      },
      totalQuantity: existingProduct.quantity + formData.quantity
    };
  }

  return { isDuplicate: false };
};

export const submitProductForm = async (
  formData: ProductFormData, 
  language: string,
  updateQuantity?: number,
  forceSeparate: boolean = false
): Promise<void> => {
  try {
    if (!forceSeparate) {
      const duplicateCheck = await checkForDuplicateProduct(formData);
      
      if (duplicateCheck.isDuplicate && duplicateCheck.existingProduct) {
        if (updateQuantity !== undefined) {
          // Update existing product with new quantity
          await updateProduct(duplicateCheck.existingProduct.id, {
            quantity: updateQuantity,
            expiryDate: formData.expiryDate,
            location: formData.location,
            notes: formData.notes.trim(),
            ...(formData.category ? { category: formData.category } : {}),
            sharedWith: formData.sharedWith
          });
          return;
        }
      }
    }

    // Add new product
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
        });
      }
    }
  } catch (error) {
    console.error('Error submitting product form:', error);
    throw error;
  }
};
