import { useState, useCallback, useEffect } from 'react';
import { ShoppingListService, ShoppingListItem } from '../services/ShoppingListService';

export type SortOption = 'createdAt' | 'name' | 'category';
export type SortDirection = 'asc' | 'desc';
export type { ShoppingListItem } from '../services/ShoppingListService';

export const useShoppingList = (onRefreshNeeded?: () => void) => {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      const loadedItems = await ShoppingListService.getUserItems();
      setItems(loadedItems);
      setFilteredItems(loadedItems);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading shopping list');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const addItem = useCallback(async (item: Omit<ShoppingListItem, 'id' | 'userId' | 'createdAt'>) => {
    try {
      await ShoppingListService.addItem(item);
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
    searchText: string,
    sortBy: SortOption,
    sortDirection: SortDirection,
    showCompleted: boolean
  ) => {
    let filtered = items.filter(item => 
      (showCompleted || !item.completed) &&
      (item.name.toLowerCase().includes(searchText.toLowerCase()) ||
       (item.category?.toLowerCase().includes(searchText.toLowerCase()) ?? false))
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = (a.category || '').localeCompare(b.category || '');
          break;
        case 'createdAt':
          comparison = (a.createdAt as any) - (b.createdAt as any);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredItems(filtered);
  }, [items]);

  return {
    items: filteredItems,
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
