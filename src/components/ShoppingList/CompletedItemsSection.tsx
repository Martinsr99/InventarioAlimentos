import React, { useState } from 'react';
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
} from '@ionic/react';
import { calendar, share, camera } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingListItem } from '../../hooks/useShoppingList';
import { getAcceptedShareUsers } from '../../services/FriendService';
import { auth } from '../../firebaseConfig';
import { BatchDateScanner } from './BatchDateScanner';
import './CompletedItemsSection.css';

interface CompletedItemsSectionProps {
  items: ShoppingListItem[];
  onAddToInventory: (itemId: string, expiryDate: string, location: string) => Promise<void>;
}

interface CompletedItemState {
  expiryDate?: string;
}

interface PopoverState {
  isOpen: boolean;
  event: Event | undefined;
  itemId: string;
}

const CompletedItemsSection: React.FC<CompletedItemsSectionProps> = ({
  items,
  onAddToInventory,
}) => {
  const { t } = useLanguage();
  const user = auth.currentUser;
  const [itemStates, setItemStates] = React.useState<Record<string, CompletedItemState>>({});
  const [showDatePicker, setShowDatePicker] = React.useState<string | null>(null);
  const [tempDate, setTempDate] = React.useState<string>('');
  const [sharedUsersInfo, setSharedUsersInfo] = React.useState<{ [key: string]: { userId: string; email: string }[] }>({});
  const [popover, setPopover] = React.useState<PopoverState>({
    isOpen: false,
    event: undefined,
    itemId: ''
  });
  const [showBatchScanner, setShowBatchScanner] = useState(false);
  const [scanningItemId, setScanningItemId] = useState<string | null>(null);
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
    };
  }, []);

  const handleDateChange = (value: string) => {
    setTempDate(value);
  };

  const handleDateConfirm = (itemId: string) => {
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
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAddAllToInventory = async () => {
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
  };

  const handleBatchDateDetected = (itemId: string, date: Date) => {
    setItemStates(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        expiryDate: date.toISOString()
      }
    }));
  };

  const handleSingleItemScan = (itemId: string) => {
    setScanningItemId(itemId);
    setShowBatchScanner(true);
  };

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
      <IonList>
        {items.map(item => (
          <IonItem key={item.id}>
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
                  <span className="item-quantity">x{item.quantity}</span>
                </h2>
              </div>
              <div className="date-actions">
                <IonInput
                  readonly
                  value={formatDisplayDate(itemStates[item.id]?.expiryDate || '')}
                  placeholder={t('products.selectDate')}
                  className="date-display"
                  onClick={() => {
                    setShowDatePicker(item.id);
                    setTempDate(itemStates[item.id]?.expiryDate || new Date().toISOString());
                  }}
                />
                {!itemStates[item.id]?.expiryDate && (
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => handleSingleItemScan(item.id)}
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
    </div>
  );
};

export default CompletedItemsSection;
