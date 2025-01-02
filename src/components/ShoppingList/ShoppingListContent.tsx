import React from 'react';
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
  items: ShoppingListItem[];
  onDelete: (itemId: string) => void;
  onToggleCompletion: (itemId: string, completed: boolean) => void;
}

const ShoppingListContent: React.FC<ShoppingListContentProps> = ({
  loading,
  items,
  onDelete,
  onToggleCompletion,
}) => {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="ion-text-center ion-padding">
        <IonSpinner />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="ion-text-center ion-padding">
        <IonText color="medium">{t('shoppingList.emptyList')}</IonText>
      </div>
    );
  }

  return (
    <IonList>
      {items.map(item => (
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
            <h2>{item.name}</h2>
            <p>{t('shoppingList.quantity', { quantity: item.quantity })}</p>
            {item.category && (
              <p>{t(`categories.${item.category}`)}</p>
            )}
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
      ))}
    </IonList>
  );
};

export default ShoppingListContent;
