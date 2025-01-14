import React, { useState, useRef, useCallback } from 'react';
import {
  IonList,
  IonItem,
  IonButton,
  IonIcon,
  IonDatetime,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonInput,
  IonPopover,
  IonAlert,
} from '@ionic/react';
import { calendar, share, camera } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingListItem } from '../../hooks/useShoppingList';
import { getAcceptedShareUsers } from '../../services/FriendService';
import { auth } from '../../firebaseConfig';
import { BatchDateScanner } from './BatchDateScanner';
import { ShoppingListService } from '../../services/ShoppingListService';
import './CompletedItemsSection.css';

interface CompletedItemsSectionProps {
  items: ShoppingListItem[];
  onAddToInventory: (itemId: string, expiryDate: string, location: string) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

interface CompletedItemState {
  expiryDate?: string;
}

interface PopoverState {
  isOpen: boolean;
  event: Event | undefined;
  itemId: string;
}

const CompletedItemsSection: React.FC<CompletedItemsSectionProps> = React.memo(({
  items,
  onAddToInventory,
  onDelete,
}) => {
  const { t } = useLanguage();
  const user = auth.currentUser;
  const [itemStates, setItemStates] = useState<Record<string, CompletedItemState>>({});
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState<string>('');
  const [sharedUsersInfo, setSharedUsersInfo] = useState<{ [key: string]: { userId: string; email: string }[] }>({});
  const [popover, setPopover] = useState<PopoverState>({
    isOpen: false,
    event: undefined,
    itemId: ''
  });
  const [showBatchScanner, setShowBatchScanner] = useState(false);
  const [scanningItemId, setScanningItemId] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const longPressRef = useRef<NodeJS.Timeout>();
  const [isLongPress, setIsLongPress] = useState(false);

  const loadSharedUsersInfo = useCallback(async (item: ShoppingListItem, event: Event) => {
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

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setPopover(prev => ({ ...prev, isOpen: false }));
    }, 3000);
  }, [user]);

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (longPressRef.current) {
        clearTimeout(longPressRef.current);
      }
    };
  }, []);

  const handleDateChange = useCallback((value: string) => {
    setTempDate(value);
  }, []);

  const handleDateConfirm = useCallback((itemId: string) => {
    if (tempDate) {
      setItemStates(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          expiryDate: tempDate
        }
      }));
      setTempDate('');
      setShowDatePicker(null);
    }
  }, [tempDate]);

  const formatDisplayDate = useCallback((dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const handleAddAllToInventory = useCallback(async () => {
    const itemsWithDates = Object.entries(itemStates)
      .filter(([_, state]) => state.expiryDate)
      .map(([id]) => id);

    for (const itemId of itemsWithDates) {
      const state = itemStates[itemId];
      if (state?.expiryDate) {
        await onAddToInventory(itemId, state.expiryDate, 'pantry');
      }
    }

    setItemStates({});
  }, [itemStates, onAddToInventory]);

  const handleBatchDateDetected = useCallback((itemId: string, date: Date) => {
    setItemStates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        expiryDate: date.toISOString()
      }
    }));
  }, []);

  const handleSingleItemScan = useCallback((itemId: string) => {
    setScanningItemId(itemId);
    setShowBatchScanner(true);
  }, []);

  const startLongPress = useCallback((itemId: string) => {
    setIsLongPress(false);
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
    }
    longPressRef.current = setTimeout(() => {
      setIsLongPress(true);
      setItemToDelete(itemId);
      setShowDeleteAlert(true);
    }, 500);
  }, []);

  const endLongPress = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (itemToDelete) {
      try {
        await onDelete(itemToDelete);
        setItemStates(prev => {
          const newState = { ...prev };
          delete newState[itemToDelete];
          return newState;
        });
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
    setShowDeleteAlert(false);
    setItemToDelete(null);
  }, [itemToDelete, onDelete]);

  const itemsWithoutDates = items.filter(item => !itemStates[item.id]?.expiryDate);
  const hasItemsWithDates = Object.values(itemStates).some(state => state.expiryDate);

  if (items.length === 0) return null;

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">{t('shoppingList.pendingInventory')}</h2>
        {itemsWithoutDates.length > 0 && (
          <IonButton
            fill="clear"
            size="small"
            onClick={() => {
              setScanningItemId(null);
              setShowBatchScanner(true);
            }}
          >
            <IonIcon slot="icon-only" icon={camera} />
          </IonButton>
        )}
      </div>
      <div className="completed-items-list">
        <IonList>
          {items.map(item => (
            <IonItem 
              key={item.id}
              onTouchStart={() => startLongPress(item.id)}
              onTouchEnd={endLongPress}
              onTouchMove={endLongPress}
              onClick={(e) => {
                if (isLongPress) {
                  e.preventDefault();
                  setIsLongPress(false);
                }
              }}
              className="long-press-item"
            >
              <div className="item-content">
                <div className="item-details">
                  <h2>
                    <div className="item-name-row">
                      <span className="item-name">{item.name}</span>
                      {item.sharedWith && item.sharedWith.length > 0 && (
                        <IonIcon 
                          icon={share} 
                          className="share-icon"
                          onClick={(e) => loadSharedUsersInfo(item, e.nativeEvent)}
                        />
                      )}
                    </div>
                  </h2>
                </div>
                <div className="item-quantity">x{item.quantity}</div>
                <div className="date-actions">
                  <IonInput
                    readonly
                    value={formatDisplayDate(itemStates[item.id]?.expiryDate || '')}
                    placeholder={t('products.selectDate')}
                    className="date-display"
                    onClick={() => {
                      if (!isLongPress) {
                        setShowDatePicker(item.id);
                        setTempDate(itemStates[item.id]?.expiryDate || new Date().toISOString());
                      }
                    }}
                  />
                  {!itemStates[item.id]?.expiryDate && (
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={(e) => {
                        if (!isLongPress) {
                          handleSingleItemScan(item.id);
                        }
                      }}
                    >
                      <IonIcon slot="icon-only" icon={camera} />
                    </IonButton>
                  )}
                </div>
              </div>

              <IonModal
                isOpen={showDatePicker === item.id}
                onDidDismiss={() => {
                  setShowDatePicker(null);
                  setTempDate('');
                }}
                className="date-picker-modal"
                mode="ios"
                backdropDismiss={false}
                animated={true}
              >
                <IonHeader className="ion-no-border">
                  <IonToolbar>
                    <IonButtons slot="start">
                      <IonButton
                        onClick={() => {
                          setShowDatePicker(null);
                          setTempDate('');
                        }}
                        fill="clear"
                        className="modal-button"
                      >
                        {t('common.cancel')}
                      </IonButton>
                    </IonButtons>
                    <IonTitle>{t('products.expiryDate')}</IonTitle>
                    <IonButtons slot="end">
                      <IonButton
                        onClick={() => handleDateConfirm(item.id)}
                        fill="clear"
                        strong={true}
                        className="modal-button"
                      >
                        {t('common.ok')}
                      </IonButton>
                    </IonButtons>
                  </IonToolbar>
                </IonHeader>
                <IonContent className="ion-padding">
                  <div className="datetime-container">
                    <IonDatetime
                      value={tempDate || new Date().toISOString()}
                      onIonChange={e => {
                        if (typeof e.detail.value === 'string') {
                          handleDateChange(e.detail.value);
                        }
                      }}
                      presentation="date"
                      preferWheel={true}
                      showDefaultButtons={false}
                      firstDayOfWeek={1}
                      locale="es-ES"
                      className="custom-datetime"
                      min={new Date().toISOString().split('T')[0]}
                      color="dark"
                      mode="ios"
                      yearValues={Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i)}
                    />
                  </div>
                </IonContent>
              </IonModal>
            </IonItem>
          ))}
        </IonList>
      </div>

      <div className="add-to-inventory-container">
        <IonButton
          fill="solid"
          color="primary"
          disabled={!hasItemsWithDates}
          onClick={handleAddAllToInventory}
          expand="block"
        >
          {t('shoppingList.addToInventory')}
        </IonButton>
      </div>

      <BatchDateScanner
        isOpen={showBatchScanner}
        onClose={() => {
          setShowBatchScanner(false);
          setScanningItemId(null);
        }}
        onDateDetected={handleBatchDateDetected}
        items={scanningItemId ? items.filter(item => item.id === scanningItemId) : itemsWithoutDates}
      />

      <IonPopover
        isOpen={popover.isOpen}
        event={popover.event}
        onDidDismiss={() => setPopover(prev => ({ ...prev, isOpen: false }))}
      >
        <div className="ion-padding">
          {sharedUsersInfo[popover.itemId]?.map(user => user.email).join(', ')}
        </div>
      </IonPopover>

      <IonAlert
        isOpen={showDeleteAlert}
        onDidDismiss={() => {
          setShowDeleteAlert(false);
          setItemToDelete(null);
        }}
        header={t('shoppingList.confirmDelete')}
        message={t('shoppingList.confirmDeleteMessage')}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel',
          },
          {
            text: t('common.delete'),
            role: 'destructive',
            handler: handleDelete,
          },
        ]}
      />
    </div>
  );
});

CompletedItemsSection.displayName = 'CompletedItemsSection';

export default CompletedItemsSection;
