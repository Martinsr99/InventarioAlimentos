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
import { ExtendedProduct, ViewMode } from '../../hooks/useProductList';

interface ProductListItemProps {
  product: ExtendedProduct;
  viewMode: ViewMode;
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
      lines="full"
    >
      <IonLabel className="ion-text-wrap">
        <h2 style={{ 
          color: 'var(--ion-text-color)',
          fontWeight: '500'
        }}>
          {product.name}
        </h2>
        {product.category && (
          <div className="category-tag">
            {t(`categories.${product.category.toLowerCase()}`)}
          </div>
        )}
        <div className="expiry-text">
          <IonIcon 
            icon={calendar} 
            color={isExpired ? 'danger' : isNearExpiry ? 'warning' : 'medium'}
            style={{ fontSize: '1.1rem' }}
          />
          <IonText 
            color={isExpired ? 'danger' : isNearExpiry ? 'warning' : 'medium'}
            style={{ 
              marginLeft: '4px',
              fontSize: '0.9rem'
            }}
          >
            {expiryText}
          </IonText>
        </div>
        {product.notes && product.notes.trim() !== '' && (
          <p style={{ 
            color: 'var(--ion-color-step-600)',
            margin: '4px 0',
            fontSize: '0.9rem'
          }}>
            {product.notes}
          </p>
        )}
        {isSharedProduct && product.sharedBy && (
          <IonChip 
            className={`shared-by-chip ${isOwnedShared ? 'owner' : ''}`}
            style={{
              margin: '8px 0 0 0',
              '--background': isOwnedShared ? 'var(--ion-color-primary)' : 'var(--ion-item-background)',
              '--color': isOwnedShared ? 'var(--ion-color-primary-contrast)' : 'var(--ion-text-color)'
            }}
          >
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
            style={{
              '--color': 'var(--ion-text-color)',
              opacity: '0.8'
            }}
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
