import React from 'react';
import {
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonLabel,
  IonBadge,
} from '@ionic/react';
import { 
  personOutline,
  peopleOutline,
} from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProductListHeaderProps {
  viewMode: 'personal' | 'shared';
  onViewModeChange: (mode: 'personal' | 'shared') => void;
  sharedProductsCount: number;
}

const ProductListHeader: React.FC<ProductListHeaderProps> = ({
  viewMode,
  onViewModeChange,
  sharedProductsCount,
}) => {
  const { t } = useLanguage();

  return (
    <IonSegment 
      value={viewMode}
      onIonChange={e => onViewModeChange(e.detail.value as 'personal' | 'shared')}
      className="view-mode-segment"
    >
      <IonSegmentButton value="personal">
        <IonIcon icon={personOutline} />
        <IonLabel>{t('products.title')}</IonLabel>
      </IonSegmentButton>
      <IonSegmentButton value="shared">
        <IonIcon icon={peopleOutline} />
        <IonLabel>{t('sharing.sharedProducts')}</IonLabel>
        {sharedProductsCount > 0 && (
          <IonBadge color="primary">{sharedProductsCount}</IonBadge>
        )}
      </IonSegmentButton>
    </IonSegment>
  );
};

export default ProductListHeader;
