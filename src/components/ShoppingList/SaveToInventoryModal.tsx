import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButtons
} from '@ionic/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingListItem } from '../../services/ShoppingListService';
import DateSelector from '../Products/AddProduct/DateSelector';

interface SaveToInventoryModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSave: (expiryDate: string, location: string) => void;
  item: ShoppingListItem;
}

export const SaveToInventoryModal: React.FC<SaveToInventoryModalProps> = ({
  isOpen,
  onDismiss,
  onSave,
  item,
}) => {
  const { t } = useLanguage();
  const [expiryDate, setExpiryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState<string>(expiryDate);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [location, setLocation] = useState<string>('');

  const handleSave = () => {
    onSave(expiryDate, location);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('shoppingList.saveToInventory')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>{t('common.cancel')}</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="ion-padding">
          <IonItem>
            <IonLabel position="stacked">{t('products.name')}</IonLabel>
            <IonInput value={item.name} readonly />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">{t('products.quantity')}</IonLabel>
            <IonInput value={item.quantity} readonly />
          </IonItem>

          <DateSelector
            expiryDate={expiryDate}
            selectedDate={selectedDate}
            isOpen={isDatePickerOpen}
            onOpen={() => setIsDatePickerOpen(true)}
            onCancel={() => {
              setSelectedDate(expiryDate);
              setIsDatePickerOpen(false);
            }}
            onConfirm={() => {
              setExpiryDate(selectedDate);
              setIsDatePickerOpen(false);
            }}
            onDateChange={(value) => {
              if (value) {
                setSelectedDate(typeof value === 'string' ? value : value[0]);
              }
            }}
          />

          <IonItem>
            <IonLabel position="stacked">{t('products.location')}</IonLabel>
            <IonSelect
              value={location}
              onIonChange={e => setLocation(e.detail.value)}
              placeholder={t('products.selectLocation')}
            >
              {Object.keys(t('locations', { returnObjects: true })).map(loc => (
                <IonSelectOption key={loc} value={loc}>
                  {t(`locations.${loc}`)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <div className="ion-padding-top">
            <IonButton expand="block" onClick={handleSave}>
              {t('common.save')}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};
