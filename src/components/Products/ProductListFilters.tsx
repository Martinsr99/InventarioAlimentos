import React, { useState } from 'react';
import {
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonLabel,
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
  const [nameDirection, setNameDirection] = useState<SortDirection>('asc');
  const [dateDirection, setDateDirection] = useState<SortDirection>('asc');

  const handleSegmentClick = (newSortBy: SortOption) => {
    if (newSortBy === sortBy) {
      // Si se hace click en el mismo criterio, cambiar dirección
      onSortDirectionChange();
      if (newSortBy === 'name') {
        setNameDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setDateDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      }
    } else {
      // Si se cambia de criterio, usar la dirección guardada
      onSortByChange(newSortBy);
      if (newSortBy === 'name') {
        onSortDirectionChange(); // Alternar si es necesario para coincidir con nameDirection
        if (sortDirection !== nameDirection) {
          onSortDirectionChange();
        }
      } else {
        if (sortDirection !== dateDirection) {
          onSortDirectionChange();
        }
      }
    }
  };

  const getDirectionIcon = (option: SortOption) => {
    if (option === sortBy) {
      return sortDirection === 'asc' ? arrowUp : arrowDown;
    }
    return option === 'name' ? 
      (nameDirection === 'asc' ? arrowUp : arrowDown) :
      (dateDirection === 'asc' ? arrowUp : arrowDown);
  };

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
          className="sort-segment"
        >
          <IonSegmentButton 
            value="name" 
            className="sort-segment-button"
            onClick={() => handleSegmentClick('name')}
          >
            <div className="sort-button-content">
              <IonIcon icon={text} />
              <IonLabel>{t('products.sortByName')}</IonLabel>
              <IonIcon 
                icon={getDirectionIcon('name')} 
                className="sort-direction-icon"
              />
            </div>
          </IonSegmentButton>
          <IonSegmentButton 
            value="expiryDate" 
            className="sort-segment-button"
            onClick={() => handleSegmentClick('expiryDate')}
          >
            <div className="sort-button-content">
              <IonIcon icon={time} />
              <IonLabel>{t('products.sortByExpiry')}</IonLabel>
              <IonIcon 
                icon={getDirectionIcon('expiryDate')} 
                className="sort-direction-icon"
              />
            </div>
          </IonSegmentButton>
        </IonSegment>
      </div>
    </div>
  );
};

export default ProductListFilters;
