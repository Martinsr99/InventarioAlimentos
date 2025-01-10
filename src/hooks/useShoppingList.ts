import { useState, useCallback, useEffect, useRef } from 'react';
import { ShoppingListService, ShoppingListItem } from '../services/ShoppingListService';
import { auth } from '../firebaseConfig';

export type SortOption = 'createdAt' | 'name' | 'category';
export type SortDirection = 'asc' | 'desc';
export type { ShoppingListItem } from '../services/ShoppingListService';

export const useShoppingList = (onRefreshNeeded?: () => void) => {
  const [myItems, setMyItems] = useState<ShoppingListItem[]>([]);
  const [sharedItems, setSharedItems] = useState<ShoppingListItem[]>([]);
  const [filteredMyItems, setFilteredMyItems] = useState<ShoppingListItem[]>([]);
  const [filteredSharedItems, setFilteredSharedItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showCompleted, setShowCompleted] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const loadedItems = await ShoppingListService.getUserItems();
      const currentUserId = auth.currentUser?.uid;
      const myItems = loadedItems.filter(item => item.userId === currentUserId);
      const sharedItems = loadedItems.filter(item => item.userId !== currentUserId);
      
      setMyItems(myItems);
      setSharedItems(sharedItems);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading shopping list');
    } finally {
      setLoading(false);
    }
  }, []);

  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      loadItems();
    }
  }, [loadItems]);

  useEffect(() => {
    const filterItems = (items: ShoppingListItem[]) => items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          (item.category?.toLowerCase().includes(searchText.toLowerCase()) ?? false);
      const matchesCompleted = showCompleted || !item.completed;
      return matchesSearch && matchesCompleted;
    });

    const sortItems = (items: ShoppingListItem[]) => [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'createdAt':
          const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
          const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
          comparison = dateA.getTime() - dateB.getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    const filteredMy = filterItems(myItems);
    const filteredShared = filterItems(sharedItems);

    setFilteredMyItems(sortItems(filteredMy));
    setFilteredSharedItems(sortItems(filteredShared));
  }, [myItems, sharedItems, searchText, sortBy, sortDirection, showCompleted]);

  const addItem = useCallback(async (item: Omit<ShoppingListItem, 'id' | 'userId' | 'createdAt'>, language: string) => {
    try {
      await ShoppingListService.addItem(item, language);
      await loadItems();
      onRefreshNeeded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding item');
      throw err;
    }
  }, [loadItems, onRefreshNeeded]);

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      await ShoppingListService.deleteItem(itemId);
      await loadItems();
      onRefreshNeeded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting item');
      throw err;
    }
  }, [loadItems, onRefreshNeeded]);

  const updateItem = useCallback(async (itemId: string, updates: Partial<ShoppingListItem>) => {
    try {
      await ShoppingListService.updateItem(itemId, updates);
      await loadItems();
      onRefreshNeeded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating item');
      throw err;
    }
  }, [loadItems, onRefreshNeeded]);

  const toggleItemCompletion = useCallback(async (itemId: string, completed: boolean) => {
    try {
      await ShoppingListService.toggleItemCompletion(itemId, completed);
      await loadItems();
      onRefreshNeeded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error toggling item completion');
      throw err;
    }
  }, [loadItems, onRefreshNeeded]);

  const deleteCompletedItems = useCallback(async () => {
    try {
      await ShoppingListService.deleteCompletedItems();
      await loadItems();
      onRefreshNeeded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting completed items');
      throw err;
    }
  }, [loadItems, onRefreshNeeded]);

  const filterAndSortItems = useCallback((
    newSearchText: string,
    newSortBy: SortOption,
    newSortDirection: SortDirection,
    newShowCompleted: boolean
  ) => {
    setSearchText(newSearchText);
    setSortBy(newSortBy);
    setSortDirection(newSortDirection);
    setShowCompleted(newShowCompleted);
  }, []);

  return {
    myItems: filteredMyItems,
    sharedItems: filteredSharedItems,
    loading,
    error,
    addItem,
    deleteItem,
    updateItem,
    toggleItemCompletion,
    deleteCompletedItems,
    filterAndSortItems,
    loadItems
  };
};
