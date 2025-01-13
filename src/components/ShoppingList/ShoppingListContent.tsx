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
  IonPopover,
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

interface ShareAlertState {
  isOpen: boolean;
  item: ShoppingListItem | null;
  friends: { userId: string; email: string }[];
}

interface SaveToInventoryState {
  isOpen: boolean;
  item: ShoppingListItem | null;
}

interface PopoverState {
  isOpen: boolean;
  event: Event | undefined;
  itemId: string;
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

  const [sharedUsersInfo, setSharedUsersInfo] = React.useState<{ [key: string]: { userId: string; email: string }[] }>({});
  const [popover, setPopover] = React.useState<PopoverState>({
    isOpen: false,
    event: undefined,
    itemId: ''
  });
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const loadSharedUsersInfo = React.useCallback(async (item: ShoppingListItem, event: Event) => {
    if (!user || !item.sharedWith?.length) return;

    const friends = await getAcceptedShareUsers(user);
    const usersInfo = item.sharedWith.map(userId => {
      const friend = friends.find(f => f.userId === userId);
      return friend || { userId, email: userId };
    });

    setSharedUsersInfo(prev => ({
      ...prev,
      [item.id]: usersInfo
    }));

    setPopover({
      isOpen: true,
      event,
      itemId: item.id
    });

    // Limpiar el timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Configurar el nuevo timeout para cerrar el popover después de 3 segundos
    timeoutRef.current = setTimeout(() => {
      setPopover(prev => ({ ...prev, isOpen: false }));
    }, 3000);
  }, [user]);

  // Limpiar timeout al desmontar
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleShare = React.useCallback(async (item: ShoppingListItem) => {
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
  }, [user]);

  const handleSaveToInventoryClick = React.useCallback((item: ShoppingListItem) => {
    setSaveToInventory({
      isOpen: true,
      item
    });
  }, []);

  const handleSaveToInventory = React.useCallback(async (expiryDate: string, location: string) => {
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

  const handleShareConfirm = React.useCallback(async (selectedFriendIds: string[]) => {
    if (!shareAlert.item) return;

    try {
      await ShoppingListService.updateItem(shareAlert.item.id, {
        sharedWith: selectedFriendIds
      });
      await loadItems();
    } catch (error) {
      console.error('Error sharing item:', error);
    }

    setShareAlert({
      isOpen: false,
      item: null,
      friends: []
    });
  }, [shareAlert.item, loadItems]);

  const renderItems = React.useCallback((items: ShoppingListItem[]) => (
    items.map(item => (
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
              {item.sharedWith && item.sharedWith.length > 0 && (
                <IonIcon 
                  icon={share} 
                  style={{ 
                    cursor: 'pointer', 
                    color: 'var(--ion-color-primary)',
                    marginLeft: '8px',
                    verticalAlign: 'middle'
                  }}
                  onClick={(e) => loadSharedUsersInfo(item, e.nativeEvent)}
                />
              )}
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
    ))
  ), [handleSaveToInventoryClick, handleShare, onDelete, onToggleCompletion, t, loadSharedUsersInfo]);

  if (loading) {
    return (
      <div className="ion-text-center ion-padding">
        <IonSpinner />
      </div>
    );
  }

  if (myItems.length === 0 && sharedItems.length === 0) {
    return (
      <div className="ion-text-center ion-padding">
        <IonText color="medium">{t('shoppingList.emptyList')}</IonText>
      </div>
    );
  }

  return (
    <>
      {myItems.length > 0 && (
        <div className="section">
          <h2 className="section-title">{t('shoppingList.myItems')}</h2>
          <IonList>
            {renderItems(myItems)}
          </IonList>
        </div>
      )}

      {sharedItems.length > 0 && (
        <div className="section">
          <h2 className="section-title">{t('shoppingList.sharedItems')}</h2>
          <IonList>
            {renderItems(sharedItems)}
          </IonList>
        </div>
      )}

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

      <IonPopover
        isOpen={popover.isOpen}
        event={popover.event}
        onDidDismiss={() => setPopover(prev => ({ ...prev, isOpen: false }))}
      >
        <div className="ion-padding">
          {sharedUsersInfo[popover.itemId]?.map(user => user.email).join(', ')}
        </div>
      </IonPopover>
    </>
  );
});

export default ShoppingListContent;
