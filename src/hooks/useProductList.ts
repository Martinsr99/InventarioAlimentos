import { useState, useEffect } from 'react';
import { Product, getProducts, deleteProduct } from '../services/InventoryService';
import { getSharedProducts, getAcceptedShareUsers } from '../services/SharedProductsService';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

export type SortOption = 'name' | 'expiryDate';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'personal' | 'shared';

export interface ExtendedProduct extends Product {
  sharedBy?: string;
  isOwner?: boolean;
}

interface UseProductListReturn {
  products: ExtendedProduct[];
  sharedProducts: ExtendedProduct[];
  filteredProducts: ExtendedProduct[];
  loading: boolean;
  loadingShared: boolean;
  error: string;
  hasFriends: boolean;
  loadProducts: () => Promise<void>;
  loadSharedProducts: () => Promise<void>;
  handleDelete: (productId: string) => Promise<void>;
  filterAndSortProducts: (params: {
    viewMode: ViewMode;
    searchText: string;
    sortBy: SortOption;
    sortDirection: SortDirection;
  }) => void;
  checkFriends: () => Promise<void>;
}

export const useProductList = (onRefreshNeeded?: () => void): UseProductListReturn => {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [sharedProducts, setSharedProducts] = useState<ExtendedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingShared, setLoadingShared] = useState(false);
  const [error, setError] = useState('');
  const [hasFriends, setHasFriends] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<{
    viewMode: ViewMode;
    searchText: string;
    sortBy: SortOption;
    sortDirection: SortDirection;
  } | null>(null);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadProducts();
        checkFriends();
      } else {
        // Clear products when user logs out
        setProducts([]);
        setSharedProducts([]);
        setFilteredProducts([]);
        setHasFriends(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Apply filters whenever products or shared products change
  useEffect(() => {
    if (currentFilters) {
      applyFilters(currentFilters);
    }
  }, [products, sharedProducts]);

  const checkFriends = async () => {
    if (!auth.currentUser) return;
    const friends = await getAcceptedShareUsers(auth.currentUser);
    setHasFriends(friends.length > 0);
  };

  const loadProducts = async () => {
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      const personalProducts = await getProducts();
      setProducts(personalProducts);
      if (onRefreshNeeded) {
        onRefreshNeeded();
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const loadSharedProducts = async () => {
    if (!auth.currentUser) return;

    setLoadingShared(true);
    try {
      const shared = await getSharedProducts(auth.currentUser);
      setSharedProducts(shared);
    } catch (error) {
      console.error('Error loading shared products:', error);
      setError('Error loading shared products');
    } finally {
      setLoadingShared(false);
    }
  };

  const applyFilters = (filters: {
    viewMode: ViewMode;
    searchText: string;
    sortBy: SortOption;
    sortDirection: SortDirection;
  }) => {
    let result = filters.viewMode === 'personal' ? [...products] : [...sharedProducts];

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase().trim();
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchLower)
      );
    }

    result.sort((a, b) => {
      if (filters.sortBy === 'name') {
        return filters.sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        const dateA = new Date(a.expiryDate).getTime();
        const dateB = new Date(b.expiryDate).getTime();
        return filters.sortDirection === 'asc'
          ? dateA - dateB
          : dateB - dateA;
      }
    });

    setFilteredProducts(result);
  };

  const filterAndSortProducts = (filters: {
    viewMode: ViewMode;
    searchText: string;
    sortBy: SortOption;
    sortDirection: SortDirection;
  }) => {
    setCurrentFilters(filters);
    applyFilters(filters);
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      setError('Error deleting product');
      throw error;
    }
  };

  return {
    products,
    sharedProducts,
    filteredProducts,
    loading,
    loadingShared,
    error,
    hasFriends,
    loadProducts,
    loadSharedProducts,
    handleDelete,
    filterAndSortProducts,
    checkFriends
  };
};
