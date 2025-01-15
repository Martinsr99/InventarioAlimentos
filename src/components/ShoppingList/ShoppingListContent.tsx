import React, { useCallback } from 'react';
import {
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { trash, checkmarkCircle, checkmarkCircleOutline } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingListItem } from '../../hooks/useShoppingList';

interface ShoppingListContentProps {
  loading: boolean;
  myItems: ShoppingListItem[];
  sharedItems: ShoppingListItem[];
  onDelete: (itemId: string) => void;
  onToggleCompletion: (itemId: string, completed: boolean) => void;
  onRefreshNeeded?: () => void;
}

const ShoppingListContent: React.FC<ShoppingListContentProps> = React.memo(({
  loading,
  myItems,
  sharedItems,
  onDelete,
  onToggleCompletion,
  onRefreshNeeded,
}) => {
  const { t } = useLanguage();

  const renderItem = useCallback((item: ShoppingListItem) => (
    <IonItem key={item.id} className={item.completed ? 'completed-item' : ''}>
      <IonButton
        fill="clear"
        slot="start"
        onClick={() => onToggleCompletion(item.id, !item.completed)}
      >
        <IonIcon
          slot="icon-only"
          icon={item.completed ? checkmarkCircle : checkmarkCircleOutline}
          color={item.completed ? 'success' : 'medium'}
        />
      </IonButton>
      <IonLabel className={item.completed ? 'completed-text' : ''}>
        <h2>
          {item.name}
          <span style={{ marginLeft: '8px', color: 'var(--ion-color-medium)' }}>
            x{item.quantity}
          </span>
        </h2>
      </IonLabel>
      <IonButton
        fill="clear"
        slot="end"
        onClick={() => onDelete(item.id)}
        color="danger"
      >
        <IonIcon slot="icon-only" icon={trash} />
      </IonButton>
    </IonItem>
  ), [onToggleCompletion, onDelete]);

  if (loading) {
    return (
      <div className="loading-spinner">
        <IonSpinner />
      </div>
    );
  }

  if (myItems.length === 0 && sharedItems.length === 0) {
    return (
      <div className="empty-state">
        <IonText color="medium">{t('shoppingList.emptyList')}</IonText>
      </div>
    );
  }

  return (
    <div className="shopping-list-content">
      {myItems.length > 0 && (
        <div className="section">
          <h2 className="section-title">{t('shoppingList.myItems')}</h2>
          <IonList>
            {myItems.map(renderItem)}
          </IonList>
        </div>
      )}

      {sharedItems.length > 0 && (
        <div className="section">
          <h2 className="section-title">{t('shoppingList.sharedItems')}</h2>
          <IonList>
            {sharedItems.map(renderItem)}
          </IonList>
        </div>
      )}
    </div>
  );
});

ShoppingListContent.displayName = 'ShoppingListContent';

export default ShoppingListContent;
