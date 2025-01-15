import React, { useState, useCallback, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
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
  IonSpinner,
  RefresherEventDetail,
  IonContent,
} from '@ionic/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useShoppingList, SortOption, SortDirection } from '../../hooks/useShoppingList';
import { ShoppingListFilters } from './ShoppingListFilters';
import ShoppingListContent from './ShoppingListContent';
import AddShoppingItem from './AddShoppingItem';
import CompletedItemsSection from './CompletedItemsSection';
import './ShoppingList.css';

interface ShoppingListProps {
  onRefreshNeeded?: () => void;
}

const ShoppingList: React.FC<ShoppingListProps> = React.memo(({ onRefreshNeeded }) => {
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showToast, setShowToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const { t } = useLanguage();

  const {
    myItems,
    sharedItems,
    loading,
    error,
    deleteItem,
    toggleItemCompletion,
    deleteCompletedItems,
    filterAndSortItems,
    moveToInventory,
    getCompletedItems,
    getPendingItems
  } = useShoppingList(onRefreshNeeded);

  useEffect(() => {
    filterAndSortItems(searchText, sortBy, sortDirection, true);
  }, [filterAndSortItems, searchText, sortBy, sortDirection]);

  const handleRefresh = useCallback(async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      onRefreshNeeded?.();
    } finally {
      event.detail.complete();
    }
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    filterAndSortItems(text, sortBy, sortDirection, true);
  }, [filterAndSortItems, sortBy, sortDirection]);

  const handleSortByChange = useCallback((option: SortOption) => {
    setSortBy(option);
    filterAndSortItems(searchText, option, sortDirection, true);
  }, [filterAndSortItems, searchText, sortDirection]);

  const handleSortDirectionChange = useCallback(() => {
    const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newDirection);
    filterAndSortItems(searchText, sortBy, newDirection, true);
  }, [filterAndSortItems, searchText, sortBy, sortDirection]);

  const handleAddItem = useCallback(async () => {
    // No need to manually refresh since we have real-time updates
    return Promise.resolve();
  }, []);

  const pendingItems = getPendingItems();
  console.log('Pending items:', pendingItems); // Debug log

  return (
    <IonContent>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>
      
      <div className="shopping-list-container">
        <IonCard className="shopping-list-card">
          <IonCardHeader>
            <IonCardTitle>{t('shoppingList.title')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <AddShoppingItem onAdd={handleAddItem} />
            <IonCardTitle className="ion-margin-start">{t('shoppingList.pendingItemsTitle')}</IonCardTitle>                
            <ShoppingListFilters
              searchText={searchText}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortByChange={handleSortByChange}
              sortDirection={sortDirection}
              onSortDirectionChange={handleSortDirectionChange}
            />
            {loading ? (
              <div className="ion-text-center ion-padding">
                <IonSpinner />
              </div>
            ) : (
              <>
                <ShoppingListContent
                  loading={false}
                  myItems={pendingItems.myPendingItems}
                  sharedItems={pendingItems.sharedPendingItems}
                  onDelete={deleteItem}
                  onToggleCompletion={toggleItemCompletion}
                  onRefreshNeeded={onRefreshNeeded}
                />
                {getCompletedItems().length > 0 && (
                  <CompletedItemsSection
                    items={getCompletedItems()}
                    onAddToInventory={moveToInventory}
                    onDelete={deleteItem}
                  />
                )}
              </>
            )}
          </IonCardContent>
        </IonCard>
      </div>

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
    </IonContent>
  );
});

ShoppingList.displayName = 'ShoppingList';

export default ShoppingList;
