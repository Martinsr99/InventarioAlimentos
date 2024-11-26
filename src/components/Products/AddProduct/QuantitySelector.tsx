import React from 'react';
import {
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
} from '@ionic/react';
import { useLanguage } from '../../../contexts/LanguageContext';

const QUANTITIES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

interface QuantitySelectorProps {
  quantity: string;
  isCustomQuantity: boolean;
  onQuantityChange: (value: string) => void;
  onCustomQuantityChange: (value: string) => void;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  isCustomQuantity,
  onQuantityChange,
  onCustomQuantityChange,
}) => {
  const { t } = useLanguage();

  return (
    <IonItem>
      <IonLabel position="stacked">{t('products.quantity')}</IonLabel>
      {!isCustomQuantity ? (
        <IonSelect
          value={quantity}
          placeholder={t('products.selectQuantity')}
          onIonChange={e => onQuantityChange(e.detail.value)}
        >
          {QUANTITIES.map(q => (
            <IonSelectOption key={q} value={q}>
              {q}
            </IonSelectOption>
          ))}
          <IonSelectOption value="custom">{t('common.custom')}</IonSelectOption>
        </IonSelect>
      ) : (
        <IonInput
          type="number"
          value={quantity}
          placeholder={t('products.enterQuantity')}
          onIonInput={e => onCustomQuantityChange(e.detail.value || '1')}
          min="1"
        />
      )}
    </IonItem>
  );
};

export default QuantitySelector;
