import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSharedProducts } from '../services/SharedProductsService';
import { getAcceptedShareUsers } from '../services/FriendService';
import { auth } from '../firebaseConfig';
import { getProducts, deleteProduct, deleteProducts as deleteProductsBatch } from '../services/InventoryService';
import { getUserSettings } from '../services/UserSettingsService';
import { checkAndDeleteExpiredProducts } from '../services/AutoDeleteService';
import { Product } from '../services/types';

export type SortOption = 'expiryDate' | 'name' | 'quantity';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'personal' | 'shared';

export interface ExtendedProduct extends Product {
  sharedBy?: string;
  isOwner?: boolean;
}

interface FilterOptions {
  viewMode: ViewMode;
  searchText: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
}

export const useProductList = (onRefreshNeeded?: () => void) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sharedProducts, setSharedProducts] = useState<ExtendedProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingShared, setLoadingShared] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFriends, setHasFriends] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    viewMode: 'personal',
    searchText: '',
    sortBy: 'expiryDate',
    sortDirection: 'asc'
  });

  const loadProducts = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const settings = await getUserSettings(auth.currentUser);
      let currentProducts = await getProducts();

      setProducts(currentProducts);

      if (settings.autoDeleteExpired) {
        await checkAndDeleteExpiredProducts(auth.currentUser, async () => {
          const updatedProducts = await getProducts();
          setProducts(updatedProducts);
          onRefreshNeeded?.();
        });
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setError('Error loading products');
    } finally {
      setLoading(false);
    }
  }, [onRefreshNeeded]);

  const loadSharedProducts = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      setLoadingShared(true);
      const shared = await getSharedProducts(auth.currentUser);
      setSharedProducts(shared);
    } catch (error) {
      console.error('Error loading shared products:', error);
      setError('Error loading shared products');
    } finally {
      setLoadingShared(false);
    }
  }, []);

  const checkFriends = useCallback(async () => {
    if (!auth.currentUser) return;

    try {
      const acceptedUsers = await getAcceptedShareUsers(auth.currentUser);
      setHasFriends(acceptedUsers.length > 0);
    } catch (error) {
      console.error('Error checking friends:', error);
    }
  }, []);

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const deleteProducts = async (productIds: string[]) => {
    try {
      await deleteProductsBatch(productIds);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
      throw error;
    }
  };

  const getExpiredProductIds = (): string[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return products
      .filter(product => {
        const expiryDate = new Date(product.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
        return expiryDate < today;
      })
      .map(product => product.id);
  };

  const deleteExpiredProducts = async () => {
    const expiredIds = getExpiredProductIds();
    if (expiredIds.length > 0) {
      await deleteProductsBatch(expiredIds);
      await loadProducts();
    }
    return expiredIds.length;
  };

  // Memoize base products with isOwner flag
  const baseProducts = useMemo(() => {
    return filterOptions.viewMode === 'personal'
      ? products.map(p => ({ ...p, isOwner: true }))
      : sharedProducts;
  }, [filterOptions.viewMode, products, sharedProducts]);

  // Memoize search results
  const searchResults = useMemo(() => {
    if (!filterOptions.searchText) return baseProducts;
    
    const searchLower = filterOptions.searchText.toLowerCase();
    return baseProducts.filter((product: ExtendedProduct) =>
      product.name.toLowerCase().includes(searchLower)
    );
  }, [baseProducts, filterOptions.searchText]);

  // Memoize sorting function
  const getSortComparator = useCallback((sortBy: SortOption, sortDirection: SortDirection) => {
    return (a: ExtendedProduct, b: ExtendedProduct) => {
      let comparison = 0;
      
      // Pre-calculate expensive operations
      if (sortBy === 'expiryDate') {
        const dateA = new Date(a.expiryDate).getTime();
        const dateB = new Date(b.expiryDate).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = a.quantity - b.quantity;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    };
  }, []);

  const filterAndSortProducts = useCallback((options: FilterOptions) => {
    const { sortBy, sortDirection } = options;
    
    // Create a new array only if we need to sort
    const sorted = [...searchResults].sort(getSortComparator(sortBy, sortDirection));
    setFilteredProducts(sorted);
  }, [searchResults, getSortComparator]);

  // Initial load
  useEffect(() => {
    if (auth.currentUser) {
      loadProducts();
      checkFriends();
    }
  }, [auth.currentUser, loadProducts, checkFriends]);

  // Load shared products when view mode changes
  useEffect(() => {
    if (filterOptions.viewMode === 'shared') {
      loadSharedProducts();
    }
  }, [filterOptions.viewMode, loadSharedProducts]);

  // Apply filters only when necessary
  useEffect(() => {
    filterAndSortProducts(filterOptions);
  }, [searchResults, filterOptions.sortBy, filterOptions.sortDirection, filterAndSortProducts]);

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
    deleteProducts,
    deleteExpiredProducts,
    getExpiredProductIds,
    filterAndSortProducts: (options: FilterOptions) => setFilterOptions(options),
    checkFriends
  };
};
