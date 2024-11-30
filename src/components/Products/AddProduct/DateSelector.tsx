import React from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonDatetime,
} from '@ionic/react';
import { useLanguage } from '../../../contexts/LanguageContext';
import './DateSelector.css';

interface DateSelectorProps {
  expiryDate: string;
  selectedDate: string;
  isOpen: boolean;
  onOpen: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onDateChange: (value: string | string[] | null | undefined) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  expiryDate,
  selectedDate,
  isOpen,
  onOpen,
  onCancel,
  onConfirm,
  onDateChange,
}) => {
  const { t } = useLanguage();

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <IonItem button onClick={onOpen} className="date-input" lines="none">
        <IonLabel position="stacked">{t('products.expiryDate')}</IonLabel>
        <IonInput
          readonly
          value={formatDisplayDate(expiryDate)}
          placeholder={t('products.selectDate')}
          className="date-display"
        />
      </IonItem>

      <IonModal 
        isOpen={isOpen}
        onDidDismiss={onCancel}
        className="date-picker-modal"
        mode="ios"
        backdropDismiss={false}
        animated={true}
      >
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton 
                onClick={onCancel} 
                fill="clear"
                className="modal-button"
              >
                {t('common.cancel')}
              </IonButton>
            </IonButtons>
            <IonTitle>{t('products.expiryDate')}</IonTitle>
            <IonButtons slot="end">
              <IonButton 
                onClick={onConfirm} 
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
              value={selectedDate || expiryDate || new Date().toISOString()}
              onIonChange={(e) => onDateChange(e.detail.value)}
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
    </>
  );
};

export default DateSelector;
