import React, { useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonActionSheet,
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
  const [showActionSheet, setShowActionSheet] = useState(false);

  return (
    <>
      <IonItem onClick={() => !isCustomQuantity && setShowActionSheet(true)} button={!isCustomQuantity}>
        <IonLabel position="stacked">{t('products.quantity')}</IonLabel>
        {!isCustomQuantity ? (
          <IonLabel>{quantity || t('products.selectQuantity')}</IonLabel>
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

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        cssClass="product-action-sheet"
        header={t('products.selectQuantity')}
        buttons={[
          ...QUANTITIES.map(q => ({
            text: q,
            cssClass: quantity === q ? 'selected-user' : '',
            handler: () => {
              onQuantityChange(q);
            }
          })),
          {
            text: t('common.custom'),
            handler: () => {
              onQuantityChange('custom');
            }
          },
          {
            text: t('common.cancel'),
            role: 'cancel'
          }
        ]}
      />
    </>
  );
};

export default QuantitySelector;
