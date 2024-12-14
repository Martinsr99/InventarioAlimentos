import React from 'react';
import {
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonButton,
  IonChip,
  IonCheckbox,
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
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  selectionMode?: boolean;
}

const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  viewMode,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
  selectionMode = false,
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

  const getExpiryStatusClass = () => {
    if (isExpired) return 'product-status-expired';
    if (isNearExpiry) return 'product-status-warning';
    return 'product-status-fresh';
  };

  const handleSelect = (e: CustomEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(product.id, e.detail.checked);
    }
  };

  return (
    <IonItem 
      className={`${isOwnedShared ? 'owned-shared-product' : isSharedProduct ? 'shared-product' : ''}`}
    >
      {selectionMode && (
        <IonCheckbox
          slot="start"
          checked={isSelected}
          onIonChange={handleSelect}
        />
      )}
      <IonLabel className="ion-text-wrap">
        <h2>{product.name}</h2>
        
        {product.category && (
          <div className="category-tag">
            {t(`categories.${product.category.toLowerCase()}`)}
          </div>
        )}
        
        <div className="expiry-text">
          <IonIcon 
            icon={calendar} 
            className={getExpiryStatusClass()}
          />
          <IonText 
            className={getExpiryStatusClass()}
          >
            {expiryText}
          </IonText>
        </div>
        
        {product.notes && product.notes.trim() !== '' && (
          <p>{product.notes}</p>
        )}
        
        {isSharedProduct && product.sharedBy && (
          <IonChip className={`shared-by-chip ${isOwnedShared ? 'owner' : ''}`}>
            <IonIcon icon={personCircleOutline} />
            <IonLabel>{product.sharedBy}</IonLabel>
          </IonChip>
        )}
      </IonLabel>

      {!selectionMode && (viewMode === 'personal' || isOwnedShared) && (
        <div className="ion-no-padding ion-no-margin">
          <IonButton 
            fill="clear" 
            onClick={() => onEdit(product.id)}
          >
            <IonIcon icon={create} slot="icon-only" />
          </IonButton>
          <IonButton 
            fill="clear" 
            onClick={() => onDelete(product.id)}
            color="danger"
          >
            <IonIcon icon={trash} slot="icon-only" />
          </IonButton>
        </div>
      )}
    </IonItem>
  );
};

export default ProductListItem;
