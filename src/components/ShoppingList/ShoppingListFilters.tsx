import React, { useState } from 'react';
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
import { SortOption } from '../../hooks/useShoppingList';

interface ShoppingListFiltersProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  sortBy: SortOption;
  onSortByChange: (option: SortOption) => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: () => void;
}

const ShoppingListFilters: React.FC<ShoppingListFiltersProps> = ({
  searchText,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
}) => {
  const { t } = useLanguage();
  const [nameDirection, setNameDirection] = useState<'asc' | 'desc'>('asc');
  const [dateDirection, setDateDirection] = useState<'asc' | 'desc'>('asc');

  const handleSegmentClick = (newSortBy: SortOption) => {
    if (newSortBy === sortBy) {
      onSortDirectionChange();
      if (newSortBy === 'name') {
        setNameDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setDateDirection(prev => prev === 'asc' ? 'desc' : 'asc');
      }
    } else {
      onSortByChange(newSortBy);
      if (newSortBy === 'name') {
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
        placeholder={t('shoppingList.searchPlaceholder')}
        className="product-searchbar"
        debounce={0}
        animated={false}
      />
      <div className="sort-controls">
        <IonSegment value={sortBy} className="sort-segment">
          <IonSegmentButton 
            value="name" 
            className="sort-segment-button"
            onClick={() => handleSegmentClick('name')}
          >
            <div className="sort-button-content">
              <IonIcon icon={text} />
              <IonLabel>{t('shoppingList.sortByName')}</IonLabel>
              <IonIcon 
                icon={getDirectionIcon('name')} 
                className="sort-direction-icon"
              />
            </div>
          </IonSegmentButton>
          <IonSegmentButton 
            value="createdAt" 
            className="sort-segment-button"
            onClick={() => handleSegmentClick('createdAt')}
          >
            <div className="sort-button-content">
              <IonIcon icon={time} />
              <IonLabel>{t('shoppingList.sortByDate')}</IonLabel>
              <IonIcon 
                icon={getDirectionIcon('createdAt')} 
                className="sort-direction-icon"
              />
            </div>
          </IonSegmentButton>
        </IonSegment>
      </div>

    </div>
  );
};

export { ShoppingListFilters };
