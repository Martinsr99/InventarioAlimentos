import productsEn from '../data/products.en.json';
import productsEs from '../data/products.es.json';
import { searchUserProducts } from './UserProductsService';

export interface PredefinedProduct {
  name: string;
  category: string;
}

export type ProductsCollection = {
  [key: string]: PredefinedProduct[];
};

export const getPredefinedProducts = async (language: string): Promise<ProductsCollection> => {
  // Get products only from the current language
  const currentLanguageProducts = language === 'es' ? productsEs : productsEn;
  const defaultProducts: ProductsCollection = {};
  
  // Add current language products
  Object.entries(currentLanguageProducts).forEach(([category, products]) => {
    defaultProducts[category] = [...products];
  });

  try {
    // Get user-specific products
    const userProducts = await searchUserProducts('');
    
    // Group user products by category
    const userProductsByCategory = userProducts.reduce<ProductsCollection>((acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }
      acc[product.category].push(product);
      return acc;
    }, {});

    // Merge user products with combined default products
    const mergedProducts: ProductsCollection = { ...defaultProducts };
    Object.entries(userProductsByCategory).forEach(([category, products]) => {
      if (!mergedProducts[category]) {
        mergedProducts[category] = [];
      }
      // Add only unique products
      products.forEach((product: PredefinedProduct) => {
        if (!mergedProducts[category].some(p => p.name.toLowerCase() === product.name.toLowerCase())) {
          mergedProducts[category].push(product);
        }
      });
    });

    return mergedProducts;
  } catch (error) {
    console.error('Error getting user products:', error);
    return defaultProducts;
  }
};

export const searchPredefinedProducts = async (query: string, language: string): Promise<PredefinedProduct[]> => {
  try {
    // Get user products that match the query first
    const userMatches = await searchUserProducts(query);
    
    // Get predefined products only from the current language
    const currentLanguageProducts = language === 'es' ? productsEs : productsEn;
    const languageMatches = Object.values(currentLanguageProducts)
      .flat()
      .filter(product => product.name.toLowerCase().includes(query.toLowerCase()));

    // Combine matches, starting with user products
    const allMatches = [...userMatches];
    
    // Add language-specific matches if not already included
    languageMatches.forEach(product => {
      if (!allMatches.some(p => p.name.toLowerCase() === product.name.toLowerCase())) {
        allMatches.push(product);
      }
    });

    // Sort results
    return allMatches
      .sort((a, b) => {
        const aLower = a.name.toLowerCase();
        const bLower = b.name.toLowerCase();
        const queryLower = query.toLowerCase();

        // Exact matches first
        if (aLower === queryLower && bLower !== queryLower) return -1;
        if (bLower === queryLower && aLower !== queryLower) return 1;

        // Then starts with matches
        if (aLower.startsWith(queryLower) && !bLower.startsWith(queryLower)) return -1;
        if (bLower.startsWith(queryLower) && !aLower.startsWith(queryLower)) return 1;

        // Finally alphabetical
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5); // Limit to 5 suggestions
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
};

export const getCategoryForProduct = async (productName: string, language: string): Promise<string | undefined> => {
  const products = await getPredefinedProducts(language);
  const normalizedName = productName.toLowerCase();
  
  for (const [category, productList] of Object.entries(products)) {
    const product = productList.find(p => p.name.toLowerCase() === normalizedName);
    if (product) {
      return product.category;
    }
  }
  
  return undefined;
};
