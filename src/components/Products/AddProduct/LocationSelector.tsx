import React, { useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonActionSheet,
} from '@ionic/react';
import { useLanguage } from '../../../contexts/LanguageContext';

const LOCATIONS = [
  'fridge',
  'freezer',
  'pantry',
  'other'
] as const;

interface LocationSelectorProps {
  location: string;
  onLocationChange: (value: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  location,
  onLocationChange,
}) => {
  const { t } = useLanguage();
  const [showActionSheet, setShowActionSheet] = useState(false);

  return (
    <>
      <IonItem onClick={() => setShowActionSheet(true)} button>
        <IonLabel position="stacked">{t('products.location')}</IonLabel>
        <IonLabel>{location ? t(`locations.${location}`) : t('products.selectLocation')}</IonLabel>
      </IonItem>

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        cssClass="product-action-sheet"
        header={t('products.selectLocation')}
        buttons={[
          ...LOCATIONS.map(loc => ({
            text: t(`locations.${loc}`),
            cssClass: location === loc ? 'selected-user' : '',
            handler: () => {
              onLocationChange(loc);
            }
          })),
          {
            text: t('common.cancel'),
            role: 'cancel'
          }
        ]}
      />
    </>
  );
};

export default LocationSelector;
