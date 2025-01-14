import React, { useState, useRef, useMemo } from 'react';
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

  const { daysUntilExpiry, expiryText } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(product.expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let text;
    if (days < 0) {
      text = t('products.expired');
    } else if (days === 0) {
      text = t('products.today');
    } else if (days === 1) {
      text = t('products.tomorrow');
    } else {
      text = `${days} ${t('products.days')}`;
    }

    return { daysUntilExpiry: days, expiryText: text };
  }, [product.expiryDate, t]);

  const categoryTranslation = useMemo(() => {
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
    
    const translationKey = categoryMap[(product.category || 'other').toLowerCase()] || 'other';
    return t(`categories.${translationKey}`);
  }, [product.category, t]);
  const { isExpired, isNearExpiry, isSharedProduct, isOwnedShared, expiryStatusClass } = useMemo(() => ({
    isExpired: daysUntilExpiry < 0,
    isNearExpiry: daysUntilExpiry <= 3 && daysUntilExpiry >= 0,
    isSharedProduct: viewMode === 'shared',
    isOwnedShared: viewMode === 'shared' && product.isOwner,
    expiryStatusClass: daysUntilExpiry < 0 
      ? 'product-status-expired' 
      : daysUntilExpiry <= 3 && daysUntilExpiry >= 0 
        ? 'product-status-warning' 
        : 'product-status-fresh'
  }), [daysUntilExpiry, viewMode, product.isOwner]);

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
            {categoryTranslation}
          </div>
        )}
        
        <div className="expiry-text">
          <IonIcon 
            icon={calendar} 
            className={expiryStatusClass}
          />
          <IonText 
            className={expiryStatusClass}
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
