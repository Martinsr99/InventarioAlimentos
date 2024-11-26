import React from 'react';
import {
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonButton,
  IonChip,
} from '@ionic/react';
import { 
  trash, 
  create, 
  calendar,
  personCircleOutline
} from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { Product } from '../../services/InventoryService';

interface ProductListItemProps {
  product: Product & {
    sharedBy?: string;
    isOwner?: boolean;
  };
  viewMode: 'personal' | 'shared';
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  viewMode,
  onEdit,
  onDelete,
}) => {
  const { t } = useLanguage();

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryText = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) {
      return t('products.expired');
    }
    if (daysUntilExpiry === 0) {
      return t('products.today');
    }
    if (daysUntilExpiry === 1) {
      return t('products.tomorrow');
    }
    return `${daysUntilExpiry} ${t('products.days')}`;
  };

  const daysUntilExpiry = calculateDaysUntilExpiry(product.expiryDate);
  const expiryText = getExpiryText(daysUntilExpiry);
  const isExpired = daysUntilExpiry < 0;
  const isNearExpiry = daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  const isSharedProduct = viewMode === 'shared';
  const isOwnedShared = isSharedProduct && product.isOwner;

  return (
    <IonItem 
      className={isOwnedShared ? 'owned-shared-product' : isSharedProduct ? 'shared-product' : ''}
    >
      <IonLabel>
        <h2>{product.name}</h2>
        {product.category && (
          <div className="category-tag">
            {t(`categories.${product.category.toLowerCase()}`)}
          </div>
        )}
        <div className="expiry-text">
          <IonIcon icon={calendar} color={isExpired ? 'danger' : isNearExpiry ? 'warning' : 'medium'} />
          <IonText color={isExpired ? 'danger' : isNearExpiry ? 'warning' : 'medium'}>
            {expiryText}
          </IonText>
        </div>
        {product.notes && product.notes.trim() !== '' && (
          <p className="notes-text">{product.notes}</p>
        )}
        {isSharedProduct && product.sharedBy && (
          <IonChip className={`shared-by-chip ${isOwnedShared ? 'owner' : ''}`}>
            <IonIcon icon={personCircleOutline} />
            <IonLabel>{product.sharedBy}</IonLabel>
          </IonChip>
        )}
      </IonLabel>
      {(viewMode === 'personal' || isOwnedShared) && (
        <>
          <IonButton 
            fill="clear" 
            slot="end"
            onClick={() => onEdit(product.id)}
            color="primary"
          >
            <IonIcon icon={create} slot="icon-only" />
          </IonButton>
          <IonButton 
            fill="clear" 
            slot="end"
            onClick={() => onDelete(product.id)}
            color="danger"
          >
            <IonIcon icon={trash} slot="icon-only" />
          </IonButton>
        </>
      )}
    </IonItem>
  );
};

export default ProductListItem;
