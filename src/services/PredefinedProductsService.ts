import productsEn from '../data/products.en.json';
import productsEs from '../data/products.es.json';

export interface PredefinedProduct {
  name: string;
  category: string;
}

export const getPredefinedProducts = (language: string): { [key: string]: PredefinedProduct[] } => {
  return language === 'es' ? productsEs : productsEn;
};

export const searchPredefinedProducts = (query: string, language: string): PredefinedProduct[] => {
  const products = getPredefinedProducts(language);
  const searchQuery = query.toLowerCase();
  
  return Object.values(products)
    .flat()
    .filter(product => {
      const words = product.name.toLowerCase().split(' ');
      
      return words.some(word => word.startsWith(searchQuery));
    })
    .slice(0, 5); // Limitar a 5 sugerencias
};

export const getCategoryForProduct = (productName: string, language: string): string | undefined => {
  const products = getPredefinedProducts(language);
  
  for (const [category, productList] of Object.entries(products)) {
    const product = productList.find(p => p.name.toLowerCase() === productName.toLowerCase());
    if (product) {
      return product.category;
    }
  }
  
  return undefined;
};
