import React from 'react';
import {
  IonSearchbar,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import {
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

  return (
    <div className="shopping-list-filters">
      <IonSearchbar
        value={searchText}
        onIonChange={e => onSearchChange(e.detail.value || '')}
        placeholder={t('shoppingList.searchPlaceholder')}
      />

      <div className="filter-controls">
        <IonItem>
          <IonLabel>{t('shoppingList.sortBy')}</IonLabel>
          <IonSelect
            value={sortBy}
            onIonChange={e => onSortByChange(e.detail.value)}
            interface="popover"
          >
            <IonSelectOption value="createdAt">{t('shoppingList.sortByDate')}</IonSelectOption>
            <IonSelectOption value="name">{t('shoppingList.sortByName')}</IonSelectOption>
            <IonSelectOption value="category">{t('shoppingList.sortByCategory')}</IonSelectOption>
          </IonSelect>
          <IonButton fill="clear" onClick={onSortDirectionChange}>
            <IonIcon slot="icon-only" icon={sortDirection === 'asc' ? arrowUp : arrowDown} />
          </IonButton>
        </IonItem>

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
    </div>
  );
};

export { ShoppingListFilters };
