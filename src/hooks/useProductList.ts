import { useState, useEffect, useCallback } from 'react';
import { getSharedProducts } from '../services/SharedProductsService';
import { getAcceptedShareUsers } from '../services/FriendService';
import { auth } from '../firebaseConfig';
import { getProducts, deleteProduct, deleteProducts as deleteProductsBatch } from '../services/InventoryService';
import { getUserSettings } from '../services/UserSettingsService';
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

      if (settings.autoDeleteExpired) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const expiredProducts = currentProducts.filter(product => {
          const expiryDate = new Date(product.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);
          return expiryDate < today;
        });

        if (expiredProducts.length > 0) {
          await deleteProductsBatch(expiredProducts.map(p => p.id));
          currentProducts = await getProducts();
        }
      }

      setProducts(currentProducts);
      if (onRefreshNeeded) {
        onRefreshNeeded();
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

  const filterAndSortProducts = useCallback((options: FilterOptions) => {
    const { viewMode, searchText, sortBy, sortDirection } = options;
    let filtered = viewMode === 'personal' 
      ? products.map(p => ({ ...p, isOwner: true })) 
      : sharedProducts;

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'expiryDate':
          comparison = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredProducts(filtered);
  }, [products, sharedProducts]);

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

  // Apply filters when products or filter options change
  useEffect(() => {
    filterAndSortProducts(filterOptions);
  }, [products, sharedProducts, filterOptions, filterAndSortProducts]);

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
