import { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { searchPredefinedProducts, PredefinedProduct } from '../services/PredefinedProductsService';

interface ProductFormState {
  name: string;
  expiryDate: string;
  quantity: string;
  category: string;
  location: string;
  notes: string;
  selectedSharedUsers: string[];
}

interface ProductFormValidation {
  validateForm: () => { isValid: boolean; error?: string };
}

export const useProductForm = (): {
  formState: ProductFormState;
  suggestions: PredefinedProduct[];
  showSuggestions: boolean;
  isCustomQuantity: boolean;
  validationError: string;
  selectedDate: string;
  inputValues: React.MutableRefObject<{
    name: string;
    quantity: string;
    notes: string;
  }>;
  setFormValue: (field: keyof ProductFormState, value: string | string[]) => void;
  handleSuggestionClick: (suggestion: PredefinedProduct) => void;
  handleQuantityChange: (value: string) => void;
  handleInputChange: (field: 'name' | 'quantity' | 'notes', value: string) => void;
  resetForm: () => void;
  validation: ProductFormValidation;
  setShowSuggestions: (show: boolean) => void;
  setSelectedDate: (date: string) => void;
  setValidationError: (error: string) => void;
} => {
  const { t, language } = useLanguage();

  const [formState, setFormState] = useState<ProductFormState>({
    name: '',
    expiryDate: '',
    quantity: '1',
    category: '',
    location: 'fridge',
    notes: '',
    selectedSharedUsers: []
  });

  const [suggestions, setSuggestions] = useState<PredefinedProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isCustomQuantity, setIsCustomQuantity] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const inputValues = useRef({
    name: '',
    quantity: '1',
    notes: '',
  });

  const setFormValue = (field: keyof ProductFormState, value: string | string[]) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    
    if (field === 'name' && typeof value === 'string') {
      if (value.trim().length > 0) {
        const results = searchPredefinedProducts(value, language);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: PredefinedProduct) => {
    setFormValue('name', suggestion.name);
    setFormValue('category', suggestion.category);
    inputValues.current.name = suggestion.name;
    setShowSuggestions(false);
  };

  const handleQuantityChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomQuantity(true);
      setFormValue('quantity', '');
      inputValues.current.quantity = '';
    } else {
      setIsCustomQuantity(false);
      setFormValue('quantity', value);
      inputValues.current.quantity = value;
    }
  };

  const handleInputChange = (field: 'name' | 'quantity' | 'notes', value: string) => {
    inputValues.current[field] = value;
    setFormValue(field, value);
  };

  const resetForm = () => {
    setFormState({
      name: '',
      expiryDate: '',
      quantity: '1',
      category: '',
      location: 'fridge',
      notes: '',
      selectedSharedUsers: []
    });
    setSelectedDate('');
    setIsCustomQuantity(false);
    setSuggestions([]);
    setShowSuggestions(false);
    setValidationError('');
    inputValues.current = {
      name: '',
      quantity: '1',
      notes: '',
    };
  };

  const validation: ProductFormValidation = {
    validateForm: () => {
      const currentName = inputValues.current.name || formState.name;
      const currentQuantity = inputValues.current.quantity || formState.quantity;

      if (!currentName.trim()) {
        return { isValid: false, error: t('validation.nameRequired') };
      }
      if (!formState.expiryDate) {
        return { isValid: false, error: t('validation.expiryRequired') };
      }
      if (!currentQuantity || Number(currentQuantity) < 1) {
        return { isValid: false, error: t('validation.quantityRequired') };
      }
      return { isValid: true };
    }
  };

  return {
    formState,
    suggestions,
    showSuggestions,
    isCustomQuantity,
    validationError,
    selectedDate,
    inputValues,
    setFormValue,
    handleSuggestionClick,
    handleQuantityChange,
    handleInputChange,
    resetForm,
    validation,
    setShowSuggestions,
    setSelectedDate,
    setValidationError
  };
};
