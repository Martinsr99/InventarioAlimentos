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
    return date.toLocaleDateString();
  };

  return (
    <>
      <IonItem button onClick={onOpen}>
        <IonLabel position="stacked">{t('products.expiryDate')}</IonLabel>
        <IonInput
          readonly
          value={formatDisplayDate(expiryDate)}
          placeholder={t('products.selectDate')}
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
        <IonContent className="ion-padding">
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={onCancel}>
                  {t('common.cancel')}
                </IonButton>
              </IonButtons>
              <IonTitle>{t('products.expiryDate')}</IonTitle>
              <IonButtons slot="end">
                <IonButton strong={true} onClick={onConfirm}>
                  {t('common.ok')}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonDatetime
            value={selectedDate || expiryDate || new Date().toISOString()}
            onIonChange={e => onDateChange(e.detail.value)}
            presentation="date"
            preferWheel={true}
            showDefaultButtons={false}
            firstDayOfWeek={1}
            locale="es-ES"
            className="custom-datetime"
            min={new Date().toISOString().split('T')[0]}
          />
        </IonContent>
      </IonModal>
    </>
  );
};

export default DateSelector;
