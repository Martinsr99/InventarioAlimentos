import React, { useState, useRef } from 'react';
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
  onEnterSelectionMode?: () => void;
}

const ProductListItem: React.FC<ProductListItemProps> = ({
  product,
  viewMode,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
  selectionMode = false,
  onEnterSelectionMode,
}) => {
  const { t } = useLanguage();
  const longPressTimer = useRef<NodeJS.Timeout>();
  const [isLongPress, setIsLongPress] = useState(false);

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

  const getCategoryTranslation = (category: string) => {
    // Mapear las categorías a las claves correctas
    const categoryMap: { [key: string]: string } = {
      'carnes': 'meat',
      'meat': 'meat',
      'dairy': 'dairy',
      'vegetables': 'vegetables',
      'fruits': 'fruits',
      'grains': 'grains',
      'beverages': 'beverages',
      'snacks': 'snacks',
      'condiments': 'condiments',
      'frozen': 'frozen',
      'ready-made': 'ready-made',
      'other': 'other'
    };
    
    const translationKey = categoryMap[category.toLowerCase()] || 'other';
    return t(`categories.${translationKey}`);
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

  const handleItemClick = (e: React.MouseEvent) => {
    if (selectionMode && onSelect && !(e.target as HTMLElement).closest('.action-buttons')) {
      onSelect(product.id, !isSelected);
    }
  };

  const handleTouchStart = () => {
    if (!selectionMode && viewMode === 'personal') {
      longPressTimer.current = setTimeout(() => {
        setIsLongPress(true);
        if (onEnterSelectionMode) {
          onEnterSelectionMode();
          onSelect?.(product.id, true);
        }
      }, 500); // 500ms para considerar long press
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    setIsLongPress(false);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <IonItem 
      className={`${isOwnedShared ? 'owned-shared-product' : isSharedProduct ? 'shared-product' : ''}`}
      onClick={handleItemClick}
      button={selectionMode}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {selectionMode && (
        <IonCheckbox
          slot="start"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      <IonLabel className="ion-text-wrap">
        <h2>{product.name}</h2>
        
        {product.category && (
          <div className="category-tag">
            {getCategoryTranslation(product.category)}
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
        <div className="action-buttons ion-no-padding ion-no-margin" onClick={handleActionClick}>
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
