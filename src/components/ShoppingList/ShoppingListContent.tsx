import React from 'react';
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
  items: ShoppingListItem[];
  onDelete: (itemId: string) => void;
  onToggleCompletion: (itemId: string, completed: boolean) => void;
  loadItems: () => Promise<void>;
}

interface ShareAlertState {
  isOpen: boolean;
  item: ShoppingListItem | null;
  friends: { userId: string; email: string }[];
}

interface SaveToInventoryState {
  isOpen: boolean;
  item: ShoppingListItem | null;
}

const ShoppingListContent: React.FC<ShoppingListContentProps> = React.memo(({
  loading,
  items,
  onDelete,
  onToggleCompletion,
  loadItems,
}) => {
  const { t } = useLanguage();
  const user = auth.currentUser;
  const [shareAlert, setShareAlert] = React.useState<ShareAlertState>({
    isOpen: false,
    item: null,
    friends: []
  });
  const [showNoFriendsAlert, setShowNoFriendsAlert] = React.useState(false);
  const [saveToInventory, setSaveToInventory] = React.useState<SaveToInventoryState>({
    isOpen: false,
    item: null
  });

  const handleShare = async (item: ShoppingListItem) => {
    if (!user) return;

    const friends = await getAcceptedShareUsers(user);
    if (friends.length === 0) {
      setShowNoFriendsAlert(true);
      return;
    }

    setShareAlert({
      isOpen: true,
      item,
      friends
    });
  };

  const handleSaveToInventoryClick = (item: ShoppingListItem) => {
    setSaveToInventory({
      isOpen: true,
      item
    });
  };

  const handleSaveToInventory = async (expiryDate: string, location: string) => {
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

      // Eliminar el item de la lista de la compra
      if (saveToInventory.item.id) {
        await ShoppingListService.deleteItem(saveToInventory.item.id);
      }

      // Recargar la lista después de guardar
      await loadItems();
      setSaveToInventory({
        isOpen: false,
        item: null
      });
    } catch (error) {
      console.error('Error saving to inventory:', error);
    }
  };

  const handleShareConfirm = async (selectedFriendIds: string[]) => {
    if (!shareAlert.item) return;

    try {
      await addProduct({
        name: shareAlert.item.name,
        quantity: shareAlert.item.quantity,
        category: shareAlert.item.category || '',
        expiryDate: new Date().toISOString(),
        location: '',
        notes: '',
        sharedWith: selectedFriendIds
      });
    } catch (error) {
      console.error('Error sharing item:', error);
    }

    setShareAlert({
      isOpen: false,
      item: null,
      friends: []
    });
  };

  if (loading) {
    return (
      <div className="ion-text-center ion-padding">
        <IonSpinner />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="ion-text-center ion-padding">
        <IonText color="medium">{t('shoppingList.emptyList')}</IonText>
      </div>
    );
  }

  return (
    <>
      <IonList>
        {items.map(item => (
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
                <h2>{item.name}</h2>
                <p>{t('shoppingList.quantity', { quantity: item.quantity })}</p>
                {item.category && (
                  <p>{t(`categories.${item.category}`)}</p>
                )}
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
        ))}
      </IonList>

      <IonAlert
        isOpen={showNoFriendsAlert}
        onDidDismiss={() => setShowNoFriendsAlert(false)}
        header={t('errors.noFriends')}
        message={t('errors.noFriendsMessage')}
        buttons={['OK']}
      />

      {shareAlert.isOpen && (
        <IonAlert
          isOpen={true}
          onDidDismiss={() => setShareAlert(prev => ({ ...prev, isOpen: false }))}
          header={t('sharing.selectFriends')}
          inputs={shareAlert.friends.map(friend => ({
            type: 'checkbox',
            label: friend.email,
            value: friend.userId,
            checked: false
          }))}
          buttons={[
            {
              text: t('common.cancel'),
              role: 'cancel'
            },
            {
              text: t('common.share'),
              handler: (data: any) => {
                if (data) {
                  handleShareConfirm(Object.keys(data));
                }
                return true;
              }
            }
          ]}
        />
      )}

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

export default ShoppingListContent;
