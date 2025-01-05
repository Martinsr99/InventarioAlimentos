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
  checkmarkCircle,
  trash,
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
  showCompleted: boolean;
  onShowCompletedChange: () => void;
  onDeleteCompleted: () => void;
}

const ShoppingListFilters: React.FC<ShoppingListFiltersProps> = ({
  searchText,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortDirection,
  onSortDirectionChange,
  showCompleted,
  onShowCompletedChange,
  onDeleteCompleted,
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

      <div className="filter-buttons">
        <IonButton fill="clear" onClick={onShowCompletedChange}>
          <IonIcon slot="start" icon={checkmarkCircle} />
          {showCompleted ? t('shoppingList.hideCompleted') : t('shoppingList.showCompleted')}
        </IonButton>

        <IonButton fill="clear" color="danger" onClick={onDeleteCompleted}>
          <IonIcon slot="start" icon={trash} />
          {t('shoppingList.deleteCompleted')}
        </IonButton>
      </div>
    </div>
  );
};

export { ShoppingListFilters };
