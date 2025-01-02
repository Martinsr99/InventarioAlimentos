import React, { useState, useCallback } from 'react';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonSpinner,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useShoppingList } from '../../hooks/useShoppingList';
import ProductSuggestions from '../Products/AddProduct/ProductSuggestions';
import QuantitySelector from '../Products/AddProduct/QuantitySelector';
import CategorySelector from '../Products/AddProduct/CategorySelector';
import { PredefinedProduct, searchPredefinedProducts } from '../../services/PredefinedProductsService';

interface AddShoppingItemProps {
  onAdd?: () => void;
}

const AddShoppingItem: React.FC<AddShoppingItemProps> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isCustomQuantity, setIsCustomQuantity] = useState(false);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<PredefinedProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const { t } = useLanguage();
  const { addItem } = useShoppingList();

  const handleNameChange = useCallback(async (value: string) => {
    setName(value);
    if (value.length >= 2) {
      setLoadingSuggestions(true);
      try {
        const results = await searchPredefinedProducts(value, t('common.language'));
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleSuggestionClick = useCallback((suggestion: PredefinedProduct) => {
    setName(suggestion.name);
    setCategory(suggestion.category);
    setShowSuggestions(false);
  }, []);

  const handleQuantityChange = useCallback((value: string) => {
    if (value === 'custom') {
      setIsCustomQuantity(true);
    } else {
      setQuantity(value);
      setIsCustomQuantity(false);
    }
  }, []);

  const handleCustomQuantityChange = useCallback((value: string) => {
    setQuantity(value);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await addItem({
        name: name.trim(),
        quantity: parseInt(quantity, 10),
        category: category || undefined,
        completed: false,
      });
      setName('');
      setQuantity('1');
      setCategory('');
      setIsCustomQuantity(false);
      onAdd?.();
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-shopping-item">
      <ProductSuggestions
        name={name}
        showSuggestions={showSuggestions}
        suggestions={suggestions}
        isLoading={loadingSuggestions}
        onNameChange={handleNameChange}
        onSuggestionClick={handleSuggestionClick}
        onInputBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onInputFocus={() => name.length >= 2 && setShowSuggestions(true)}
      />

      <QuantitySelector
        quantity={quantity}
        isCustomQuantity={isCustomQuantity}
        onQuantityChange={handleQuantityChange}
        onCustomQuantityChange={handleCustomQuantityChange}
      />

      <CategorySelector
        category={category}
        onCategoryChange={setCategory}
      />

      <IonButton
        expand="block"
        type="submit"
        disabled={loading || !name.trim()}
      >
        {loading ? (
          <IonSpinner name="crescent" />
        ) : (
          <>
            <IonIcon slot="start" icon={add} />
            {t('shoppingList.addItem')}
          </>
        )}
      </IonButton>
    </form>
  );
};

export default AddShoppingItem;
