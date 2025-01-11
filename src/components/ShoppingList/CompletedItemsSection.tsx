import React, { useState } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
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
} from '@ionic/react';
import { calendar } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingListItem } from '../../hooks/useShoppingList';

interface CompletedItemsSectionProps {
  items: ShoppingListItem[];
  onAddToInventory: (itemId: string, expiryDate: string, location: string) => Promise<void>;
}

interface CompletedItemState {
  expiryDate?: string;
}

const CompletedItemsSection: React.FC<CompletedItemsSectionProps> = ({
  items,
  onAddToInventory,
}) => {
  const { t } = useLanguage();
  const [itemStates, setItemStates] = React.useState<Record<string, CompletedItemState>>({});
  const [showDatePicker, setShowDatePicker] = React.useState<string | null>(null);
  const [tempDate, setTempDate] = React.useState<string>('');

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

    // Clear states for added items
    setItemStates(prev => {
      const newState = { ...prev };
      itemsWithDates.forEach(id => delete newState[id]);
      return newState;
    });
  };

  const hasItemsWithDates = Object.values(itemStates).some(state => state.expiryDate);

  if (items.length === 0) return null;

  return (
    <div className="section">
      <h2 className="section-title">{t('shoppingList.pendingInventory')}</h2>
      <IonList>
        {items.map(item => (
          <IonItem key={item.id}>
            <div className="item-content">
              <div className="item-details">
                <h2>{item.name}</h2>
                <div className="item-info">
                  <p>{t('shoppingList.quantity', { quantity: item.quantity })}</p>
                  {item.category && (
                    <p>{t(`categories.${item.category}`)}</p>
                  )}
                </div>
              </div>
              <div className="date-input-container">
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
                    style={{
                      '--background': 'var(--ion-background-color)',
                      '--wheel-fade-background-rgb': 'var(--ion-background-color-rgb)',
                      '--wheel-item-color': 'var(--ion-text-color)',
                      '--wheel-selected-item-color': 'var(--ion-text-color)',
                      '--wheel-selected-item-background': 'var(--ion-background-color)',
                      '--highlight-background': 'var(--ion-background-color)',
                      '--highlight-color': 'var(--ion-text-color)',
                      '--wheel-highlight-background': 'var(--ion-background-color)',
                      '--wheel-col-background': 'var(--ion-background-color)',
                      '--wheel-item-font-size': '22px',
                      '--wheel-item-padding-start': '20px',
                      '--wheel-item-padding-end': '20px',
                      '--wheel-selected-item-font-weight': '600',
                      '--wheel-picker-option-background': 'var(--ion-background-color)',
                      '--wheel-picker-option-selected-background': 'var(--ion-background-color)',
                      '--wheel-picker-background': 'var(--ion-background-color)',
                      '--wheel-fade-mask-background': 'var(--ion-background-color)',
                      'background': 'var(--ion-background-color)'
                    }}
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
    </div>
  );
};

export default CompletedItemsSection;
