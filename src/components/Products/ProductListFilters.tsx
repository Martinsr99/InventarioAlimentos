import React from 'react';
import {
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonLabel,
  IonButton,
} from '@ionic/react';
import { 
  text,
  time,
  arrowUp,
  arrowDown,
} from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { SortOption, SortDirection } from '../../hooks/useProductList';

interface ProductListFiltersProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortByChange: (value: SortOption) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: () => void;
}

const ProductListFilters: React.FC<ProductListFiltersProps> = ({
  searchText,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
}) => {
  const { t } = useLanguage();

  return (
    <div className="filters-container">
      <IonSearchbar
        value={searchText}
        onIonInput={e => onSearchChange(e.detail.value || '')}
        placeholder={t('products.searchPlaceholder')}
        className="product-searchbar"
        debounce={0}
        animated={false}
      />
      <div className="sort-controls">
        <IonSegment 
          value={sortBy} 
          onIonChange={e => onSortByChange(e.detail.value as SortOption)}
          className="sort-segment"
        >
          <IonSegmentButton value="name" className="sort-segment-button">
            <IonIcon icon={text} />
            <IonLabel>{t('products.sortByName')}</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="expiryDate" className="sort-segment-button">
            <IonIcon icon={time} />
            <IonLabel>{t('products.sortByExpiry')}</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        <IonButton
          fill="clear"
          className="sort-direction-button"
          onClick={onSortDirectionChange}
        >
          <IonIcon icon={sortDirection === 'asc' ? arrowUp : arrowDown} />
        </IonButton>
      </div>
    </div>
  );
};

export default ProductListFilters;
