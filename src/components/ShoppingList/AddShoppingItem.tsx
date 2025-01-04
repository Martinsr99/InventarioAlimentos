import React, { useState, useEffect } from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonActionSheet,
  IonSpinner,
} from '@ionic/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingListService } from '../../services/ShoppingListService';
import { searchPredefinedProducts, PredefinedProduct } from '../../services/PredefinedProductsService';
import './AddShoppingItem.css';

const QUANTITIES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

interface AddShoppingItemProps {
  onAdd?: () => Promise<void>;
}

const AddShoppingItem: React.FC<AddShoppingItemProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isCustomQuantity, setIsCustomQuantity] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState<string>('');
  const [showQuantityActionSheet, setShowQuantityActionSheet] = useState(false);
  const [suggestions, setSuggestions] = useState<PredefinedProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const loadSuggestions = async () => {
      if (name.trim().length > 0) {
        setIsLoading(true);
        try {
          const results = await searchPredefinedProducts(name.trim(), t('language'));
          setSuggestions(results);
        } catch (error) {
          console.error('Error loading suggestions:', error);
        }
        setIsLoading(false);
      } else {
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(loadSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [name]);

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
        quantity: Number(quantity),
        category: category || undefined,
        completed: false,
      });

      setName('');
      setQuantity('1');
      setCategory('');
      setIsCustomQuantity(false);

      if (onAdd) {
        await onAdd();
      }
    } catch (err) {
      setError(t('errors.addItem'));
      setShowToast(true);
    }
  };

  const handleQuantityChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomQuantity(true);
      setQuantity('');
    } else {
      setQuantity(value);
      setIsCustomQuantity(false);
    }
  };

  const handleSuggestionClick = (suggestion: PredefinedProduct) => {
    setName(suggestion.name);
    setCategory(suggestion.category);
    setShowSuggestions(false);
  };

  return (
    <form onSubmit={handleSubmit} className="add-shopping-item">
      <div className="product-name-container">
        <IonItem>
          <IonLabel position="stacked">{t('shoppingList.itemName')}</IonLabel>
          <IonInput
            value={name}
            onIonInput={e => setName(e.detail.value || '')}
            placeholder={t('shoppingList.itemNamePlaceholder')}
            onIonFocus={() => setShowSuggestions(true)}
            onIonBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {isLoading && (
            <div className="suggestions-loading">
              <IonSpinner name="crescent" />
            </div>
          )}
        </IonItem>
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="suggestion-name">{suggestion.name}</div>
                <IonLabel color="medium" className="suggestion-category">
                  {t(`categories.${suggestion.category}`)}
                </IonLabel>
              </div>
            ))}
          </div>
        )}
      </div>

      <IonItem onClick={() => !isCustomQuantity && setShowQuantityActionSheet(true)} button={!isCustomQuantity}>
        <IonLabel position="stacked">{t('shoppingList.quantity')}</IonLabel>
        {!isCustomQuantity ? (
          <IonLabel>{quantity || t('shoppingList.selectQuantity')}</IonLabel>
        ) : (
          <IonInput
            type="number"
            value={quantity}
            placeholder={t('shoppingList.enterQuantity')}
            onIonInput={e => setQuantity(e.detail.value || '1')}
            min="1"
          />
        )}
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

      <IonButton expand="block" type="submit" className="submit-button">
        {t('shoppingList.addItem')}
      </IonButton>

      <IonActionSheet
        isOpen={showQuantityActionSheet}
        onDidDismiss={() => setShowQuantityActionSheet(false)}
        cssClass="product-action-sheet"
        header={t('shoppingList.selectQuantity')}
        buttons={[
          ...QUANTITIES.map(q => ({
            text: q,
            cssClass: quantity === q ? 'selected-quantity' : '',
            handler: () => {
              handleQuantityChange(q);
            }
          })),
          {
            text: t('common.custom'),
            handler: () => {
              handleQuantityChange('custom');
            }
          },
          {
            text: t('common.cancel'),
            role: 'cancel'
          }
        ]}
      />

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
