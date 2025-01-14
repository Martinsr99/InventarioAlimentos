import React, { useCallback, useState } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonAlert,
  IonPopover,
  IonContent,
} from '@ionic/react';
import { trash, checkmarkCircle, checkmarkCircleOutline, archive, share } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { auth } from '../../firebaseConfig';
import { ShoppingListItem } from '../../hooks/useShoppingList';
import { getAcceptedShareUsers } from '../../services/FriendService';
import { addProduct } from '../../services/InventoryService';
import { ShoppingListService } from '../../services/ShoppingListService';
import { SaveToInventoryModal } from './SaveToInventoryModal';

interface ShoppingListContentProps {
  loading: boolean;
  myItems: ShoppingListItem[];
  sharedItems: ShoppingListItem[];
  onDelete: (itemId: string) => void;
  onToggleCompletion: (itemId: string, completed: boolean) => void;
  loadItems: () => Promise<void>;
  onRefreshNeeded?: () => void;
}

interface SaveToInventoryState {
  isOpen: boolean;
  item: ShoppingListItem | null;
}

const ShoppingListContent: React.FC<ShoppingListContentProps> = React.memo(({
  loading,
  myItems,
  sharedItems,
  onDelete,
  onToggleCompletion,
  loadItems,
  onRefreshNeeded,
}) => {
  const { t } = useLanguage();
  const user = auth.currentUser;
  const [saveToInventory, setSaveToInventory] = useState<SaveToInventoryState>({
    isOpen: false,
    item: null
  });

  const handleSaveToInventoryClick = useCallback((item: ShoppingListItem) => {
    setSaveToInventory({
      isOpen: true,
      item
    });
  }, []);

  const handleSaveToInventory = useCallback(async (expiryDate: string, location: string) => {
    if (!saveToInventory.item) return;

    try {
      await addProduct({
        name: saveToInventory.item.name,
        quantity: saveToInventory.item.quantity,
        category: saveToInventory.item.category || '',
        expiryDate,
        location,
        notes: '',
      });

      if (saveToInventory.item.id) {
        await ShoppingListService.deleteItem(saveToInventory.item.id);
      }

      await loadItems();
      setSaveToInventory({
        isOpen: false,
        item: null
      });
    } catch (error) {
      console.error('Error saving to inventory:', error);
    }
  }, [saveToInventory.item, loadItems]);

  const handleShare = useCallback(async (item: ShoppingListItem) => {
    if (!user) return;

    const friends = await getAcceptedShareUsers(user);
    if (friends.length === 0) {
      // Show no friends alert
      return;
    }

    // Show share alert
  }, [user]);

  const renderItem = useCallback((item: ShoppingListItem) => (
    <IonItemSliding key={item.id}>
      <IonItemOptions side="start">
        <IonItemOption color="success" onClick={() => handleSaveToInventoryClick(item)}>
          <IonIcon slot="icon-only" icon={archive} />
        </IonItemOption>
      </IonItemOptions>

      <IonItem className={item.completed ? 'completed-item' : ''}>
        <IonButton
          fill="clear"
          slot="start"
          onClick={() => onToggleCompletion(item.id, !item.completed)}
        >
          <IonIcon
            slot="icon-only"
            icon={item.completed ? checkmarkCircle : checkmarkCircleOutline}
            color={item.completed ? 'success' : 'medium'}
          />
        </IonButton>
        <IonLabel className={item.completed ? 'completed-text' : ''}>
          <h2>
            {item.name}
            <span style={{ marginLeft: '8px', color: 'var(--ion-color-medium)' }}>
              x{item.quantity}
            </span>
          </h2>
        </IonLabel>
        <IonButton
          fill="clear"
          slot="end"
          onClick={() => onDelete(item.id)}
          color="danger"
        >
          <IonIcon slot="icon-only" icon={trash} />
        </IonButton>
      </IonItem>

      <IonItemOptions side="end">
        <IonItemOption color="primary" onClick={() => handleShare(item)}>
          <IonIcon slot="icon-only" icon={share} />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  ), [onToggleCompletion, onDelete, handleSaveToInventoryClick, handleShare]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <IonSpinner />
      </div>
    );
  }

  if (myItems.length === 0 && sharedItems.length === 0) {
    return (
      <div className="empty-state">
        <IonText color="medium">{t('shoppingList.emptyList')}</IonText>
      </div>
    );
  }

  return (
    <>
      <IonContent scrollY>
        {myItems.length > 0 && (
          <div className="section">
            <h2 className="section-title">{t('shoppingList.myItems')}</h2>
            <IonList>
              {myItems.map(renderItem)}
            </IonList>
          </div>
        )}

        {sharedItems.length > 0 && (
          <div className="section">
            <h2 className="section-title">{t('shoppingList.sharedItems')}</h2>
            <IonList>
              {sharedItems.map(renderItem)}
            </IonList>
          </div>
        )}
      </IonContent>

      {saveToInventory.isOpen && saveToInventory.item && (
        <SaveToInventoryModal
          isOpen={true}
          onDismiss={() => setSaveToInventory({ isOpen: false, item: null })}
          onSave={handleSaveToInventory}
          item={saveToInventory.item}
        />
      )}
    </>
  );
});

ShoppingListContent.displayName = 'ShoppingListContent';

export default ShoppingListContent;
