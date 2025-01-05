import React, { useState, useCallback, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonAlert,
  IonToast,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
} from '@ionic/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useShoppingList, SortOption, SortDirection } from '../../hooks/useShoppingList';
import { ShoppingListFilters } from './ShoppingListFilters';
import ShoppingListContent from './ShoppingListContent';
import AddShoppingItem from './AddShoppingItem';
import './ShoppingList.css';

interface ShoppingListProps {
  onRefreshNeeded?: () => void;
}

const ShoppingList: React.FC<ShoppingListProps> = React.memo(({ onRefreshNeeded }) => {
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showCompleted, setShowCompleted] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showDeleteCompletedConfirm, setShowDeleteCompletedConfirm] = useState(false);
  
  const { t } = useLanguage();

  const {
    items,
    loading,
    error,
    deleteItem,
    toggleItemCompletion,
    deleteCompletedItems,
    filterAndSortItems,
    loadItems
  } = useShoppingList(onRefreshNeeded);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    filterAndSortItems(searchText, sortBy, sortDirection, showCompleted);
  }, [filterAndSortItems, searchText, sortBy, sortDirection, showCompleted]);

  const handleRefresh = useCallback(async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await loadItems();
    } finally {
      event.detail.complete();
    }
  }, [loadItems]);

  const handleDeleteConfirm = useCallback(async (itemId: string) => {
    try {
      await deleteItem(itemId);
    } catch (error) {
      setShowToast(true);
      setErrorMessage(t('errors.itemDelete'));
    }
    setItemToDelete(null);
  }, [deleteItem, t]);

  const handleDeleteCompletedConfirm = useCallback(async () => {
    try {
      await deleteCompletedItems();
    } catch (error) {
      setShowToast(true);
      setErrorMessage(t('errors.itemDelete'));
    }
    setShowDeleteCompletedConfirm(false);
  }, [deleteCompletedItems, t]);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    filterAndSortItems(text, sortBy, sortDirection, showCompleted);
  }, [filterAndSortItems, sortBy, sortDirection, showCompleted]);

  const handleSortByChange = useCallback((option: SortOption) => {
    setSortBy(option);
    filterAndSortItems(searchText, option, sortDirection, showCompleted);
  }, [filterAndSortItems, searchText, sortDirection, showCompleted]);

  const handleSortDirectionChange = useCallback(() => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    filterAndSortItems(searchText, sortBy, newDirection, showCompleted);
  }, [filterAndSortItems, searchText, sortBy, sortDirection, showCompleted]);

  const handleShowCompletedChange = useCallback(() => {
    const newShowCompleted = !showCompleted;
    setShowCompleted(newShowCompleted);
    filterAndSortItems(searchText, sortBy, sortDirection, newShowCompleted);
  }, [filterAndSortItems, searchText, sortBy, sortDirection, showCompleted]);

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>
      
      <div className="shopping-list-container">
        <IonCard className="shopping-list-card">
          <IonCardHeader>
            <IonCardTitle>{t('shoppingList.title')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent className="shopping-list-content">
            <AddShoppingItem onAdd={loadItems} />
            <ShoppingListFilters
              searchText={searchText}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortByChange={handleSortByChange}
              sortDirection={sortDirection}
              onSortDirectionChange={handleSortDirectionChange}
              showCompleted={showCompleted}
              onShowCompletedChange={handleShowCompletedChange}
              onDeleteCompleted={() => setShowDeleteCompletedConfirm(true)}
            />
            <ShoppingListContent
              loading={loading}
              items={items.filter(item => showCompleted || !item.completed)}
              onDelete={setItemToDelete}
              onToggleCompletion={toggleItemCompletion}
              loadItems={loadItems}
              onRefreshNeeded={onRefreshNeeded}
            />
          </IonCardContent>
        </IonCard>
      </div>

      <IonAlert
        isOpen={!!itemToDelete}
        onDidDismiss={() => setItemToDelete(null)}
        header={t('shoppingList.confirmDelete')}
        message={t('shoppingList.confirmDeleteMessage')}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: t('common.delete'),
            handler: () => {
              if (itemToDelete) {
                handleDeleteConfirm(itemToDelete);
              }
            }
          }
        ]}
      />

      <IonAlert
        isOpen={showDeleteCompletedConfirm}
        onDidDismiss={() => setShowDeleteCompletedConfirm(false)}
        header={t('shoppingList.confirmDeleteCompleted')}
        message={t('shoppingList.confirmDeleteCompletedMessage')}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel',
            cssClass: 'secondary'
          },
          {
            text: t('common.delete'),
            handler: handleDeleteCompletedConfirm
          }
        ]}
      />

      <IonToast
        isOpen={showToast}
        message={errorMessage || error || ''}
        duration={3000}
        color="danger"
        onDidDismiss={() => {
          setShowToast(false);
          setErrorMessage('');
        }}
      />
    </>
  );
});

ShoppingList.displayName = 'ShoppingList';

export default ShoppingList;
