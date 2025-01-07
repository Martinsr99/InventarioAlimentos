import React, { useState, useEffect } from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonToast,
  IonActionSheet,
  IonSpinner,
} from '@ionic/react';
import ProductSuggestions from '../Products/AddProduct/ProductSuggestions';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShoppingListService } from '../../services/ShoppingListService';
import { searchPredefinedProducts, PredefinedProduct } from '../../services/PredefinedProductsService';
import { addUserProduct } from '../../services/UserProductsService';
import CategorySelector from '../Products/AddProduct/CategorySelector';
import './AddShoppingItem.css';

const QUANTITIES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

interface AddShoppingItemProps {
  onAdd?: () => Promise<void>;
}

const AddShoppingItem: React.FC<AddShoppingItemProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isCustomQuantity, setIsCustomQuantity] = useState(false);
  const [category, setCategory] = useState<string>('other');
  const [showToast, setShowToast] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [showQuantityActionSheet, setShowQuantityActionSheet] = useState(false);
  const [suggestions, setSuggestions] = useState<PredefinedProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    const loadSuggestions = async () => {
      if (name.trim().length > 0) {
        setIsLoading(true);
        try {
          const results = await searchPredefinedProducts(name.trim(), language);
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
      const trimmedName = name.trim();
      
      // Buscamos si existe en los predefinidos del idioma actual
      const predefinedProducts = await searchPredefinedProducts(trimmedName, language);
      const exactMatch = predefinedProducts.find(p => 
        p.name.toLowerCase() === trimmedName.toLowerCase()
      );

      let nameToUse = trimmedName;
      let categoryToUse = category;

      if (exactMatch) {
        // Si existe en predefinidos, usamos el nombre exacto y su categoría
        nameToUse = exactMatch.name;
        categoryToUse = exactMatch.category;
      } else if (category) {
        // Si no existe en predefinidos y tiene categoría, lo guardamos como producto personalizado
        await addUserProduct({
          name: trimmedName,
          category: category
        });
      }

      // Añadir a la lista de compras
      await ShoppingListService.addItem({
        name: nameToUse,
        quantity: Number(quantity),
        category: categoryToUse || undefined,
        completed: false,
      }, language);

      setName('');
      setQuantity('1');
      setCategory('');
      setIsCustomQuantity(false);

      setSuccess(true);
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
      <ProductSuggestions
        name={name}
        showSuggestions={showSuggestions}
        suggestions={suggestions}
        isLoading={isLoading}
        onNameChange={value => setName(value)}
        onSuggestionClick={handleSuggestionClick}
        onInputBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onInputFocus={() => setShowSuggestions(true)}
      />

      <IonItem onClick={() => !isCustomQuantity && setShowQuantityActionSheet(true)} button={!isCustomQuantity}>
        <IonLabel position="stacked">{t('shoppingList.quantity')}</IonLabel>
        {!isCustomQuantity ? (
          <IonLabel>{quantity || t('shoppingList.selectQuantity')}</IonLabel>
        ) : (
          <IonInput
            type="number"
            value={quantity}
            placeholder={t('shoppingList.enterQuantity')}
            onIonInput={(e: CustomEvent) => setQuantity(e.detail.value || '1')}
            min="1"
          />
        )}
      </IonItem>

      <CategorySelector
        category={category}
        onCategoryChange={value => setCategory(value)}
      />

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

      <IonToast
        isOpen={success}
        message={t('shoppingList.addSuccess')}
        duration={2000}
        color="success"
        onDidDismiss={() => setSuccess(false)}
      />
    </form>
  );
};

export default AddShoppingItem;
