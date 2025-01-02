import React from 'react';
import {
  IonSearchbar,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonLabel,
  IonItem,
} from '@ionic/react';
import { arrowUp, arrowDown, checkboxOutline, trashBin } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { SortOption, SortDirection } from '../../hooks/useShoppingList';

interface ShoppingListFiltersProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  sortBy: SortOption;
  onSortByChange: (option: SortOption) => void;
  sortDirection: SortDirection;
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

  return (
    <div className="shopping-list-filters">
      <IonSearchbar
        value={searchText}
        onIonChange={e => onSearchChange(e.detail.value || '')}
        placeholder={t('shoppingList.searchPlaceholder')}
      />
      
      <div className="shopping-list-actions">
        <IonButton
          fill="clear"
          onClick={onShowCompletedChange}
        >
          <IonIcon slot="icon-only" icon={checkboxOutline} />
        </IonButton>
        <IonButton
          fill="clear"
          onClick={onDeleteCompleted}
          color="danger"
        >
          <IonIcon slot="icon-only" icon={trashBin} />
        </IonButton>
      </div>

      <div className="filter-controls">
        <IonSelect
          value={sortBy}
          onIonChange={e => onSortByChange(e.detail.value)}
          interface="popover"
          placeholder={t('shoppingList.sortBy')}
        >
          <IonSelectOption value="createdAt">{t('shoppingList.sortByDate')}</IonSelectOption>
          <IonSelectOption value="name">{t('shoppingList.sortByName')}</IonSelectOption>
          <IonSelectOption value="category">{t('shoppingList.sortByCategory')}</IonSelectOption>
        </IonSelect>

        <IonButton
          fill="clear"
          onClick={onSortDirectionChange}
        >
          <IonIcon slot="icon-only" icon={sortDirection === 'asc' ? arrowUp : arrowDown} />
        </IonButton>

        <IonItem lines="none">
          <IonLabel>{t('shoppingList.showCompleted')}</IonLabel>
          <IonToggle
            checked={showCompleted}
            onIonChange={onShowCompletedChange}
          />
        </IonItem>
      </div>
    </div>
  );
};

export default ShoppingListFilters;
