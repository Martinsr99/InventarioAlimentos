import React, { useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonToast,
} from '@ionic/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingListService } from '../../services/ShoppingListService';

interface AddShoppingItemProps {
  onAdd?: () => Promise<void>;
}

const AddShoppingItem: React.FC<AddShoppingItemProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [category, setCategory] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string>('');
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t('validation.nameRequired'));
      setShowToast(true);
      return;
    }

    try {
      await ShoppingListService.addItem({
        name: name.trim(),
        quantity,
        category: category || undefined,
        completed: false,
      });

      setName('');
      setQuantity(1);
      setCategory('');

      if (onAdd) {
        await onAdd();
      }
    } catch (err) {
      setError(t('errors.addItem'));
      setShowToast(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-shopping-item">
      <IonItem>
        <IonLabel position="stacked">{t('shoppingList.itemName')}</IonLabel>
        <IonInput
          value={name}
          onIonChange={e => setName(e.detail.value || '')}
          placeholder={t('shoppingList.itemNamePlaceholder')}
        />
      </IonItem>

      <IonItem>
        <IonLabel position="stacked">{t('shoppingList.quantity')}</IonLabel>
        <IonInput
          type="number"
          value={quantity}
          onIonChange={e => setQuantity(Number(e.detail.value))}
          min={1}
        />
      </IonItem>

      <IonItem>
        <IonLabel position="stacked">{t('shoppingList.category')}</IonLabel>
        <IonSelect
          value={category}
          onIonChange={e => setCategory(e.detail.value)}
          placeholder={t('shoppingList.selectCategory')}
        >
          {Object.keys(t('categories', { returnObjects: true })).map(cat => (
            <IonSelectOption key={cat} value={cat}>
              {t(`categories.${cat}`)}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>

      <IonButton expand="block" type="submit">
        {t('shoppingList.addItem')}
      </IonButton>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={error}
        duration={3000}
        color="danger"
      />
    </form>
  );
};

export default AddShoppingItem;
