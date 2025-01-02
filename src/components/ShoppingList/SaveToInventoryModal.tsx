import React, { useState } from 'react';
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
  IonButtons,
} from '@ionic/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingListItem } from '../../services/ShoppingListService';

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
  const [expiryDate, setExpiryDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
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

          <IonItem>
            <IonLabel position="stacked">{t('products.expiryDate')}</IonLabel>
            <IonInput
              type="date"
              value={expiryDate}
              onIonChange={e => setExpiryDate(e.detail.value || '')}
            />
          </IonItem>

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
