import { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ProductCategory, ProductLocation } from '../constants/productConstants';
import { submitProductEdit } from '../services/EditProductService';

interface EditProductFormState {
  name: string;
  expiryDate: string;
  quantity: string;
  category: ProductCategory | '';
  location: ProductLocation;
  notes: string;
  selectedSharedUsers: string[];
}

interface EditProductFormValidation {
  validateForm: () => { isValid: boolean; error?: string };
}

interface InitialData {
  name: string;
  expiryDate: string;
  quantity: number;
  category?: ProductCategory;
  location: ProductLocation;
  notes?: string;
  sharedWith?: string[];
}

export const useEditProductForm = (initialData: InitialData) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formState, setFormState] = useState<EditProductFormState>({
    name: initialData.name,
    expiryDate: initialData.expiryDate,
    quantity: initialData.quantity.toString(),
    category: initialData.category || '',
    location: initialData.location,
    notes: initialData.notes || '',
    selectedSharedUsers: initialData.sharedWith || []
  });

  const [isCustomQuantity, setIsCustomQuantity] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(initialData.expiryDate);

  const inputValues = useRef({
    name: initialData.name,
    quantity: initialData.quantity.toString(),
    notes: initialData.notes || '',
  });

  const setFormValue = (field: keyof EditProductFormState, value: string | string[]) => {
    setFormState(prev => ({ ...prev, [field]: value }));
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

  const validation: EditProductFormValidation = {
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
    isCustomQuantity,
    validationError,
    selectedDate,
    inputValues,
    isLoading,
    error,
    success,
    setFormValue,
    handleQuantityChange,
    handleInputChange,
    validation,
    setSelectedDate,
    setValidationError
  };
};
