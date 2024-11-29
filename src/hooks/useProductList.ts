import { useState, useEffect } from 'react';
import { getSharedProducts } from '../services/SharedProductsService';
import { getAcceptedShareUsers } from '../services/FriendService';
import { auth } from '../firebaseConfig';
import { getProducts, deleteProduct } from '../services/InventoryService';
import { Product } from '../services/InventoryService';

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

  const loadProducts = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const userProducts = await getProducts();
      setProducts(userProducts);
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
  };

  const checkFriends = async () => {
    if (!auth.currentUser) return;

    try {
      const acceptedUsers = await getAcceptedShareUsers(auth.currentUser);
      setHasFriends(acceptedUsers.length > 0);
    } catch (error) {
      console.error('Error checking friends:', error);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const filterAndSortProducts = (options: FilterOptions) => {
    const { viewMode, searchText, sortBy, sortDirection } = options;
    let filtered = viewMode === 'personal' 
      ? products.map(p => ({ ...p, isOwner: true })) 
      : sharedProducts;

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
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
