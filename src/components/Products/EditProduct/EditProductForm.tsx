import React, { useState, useEffect, useRef } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonToast,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { updateProduct } from '../../../services/InventoryService';
import { useLanguage } from '../../../contexts/LanguageContext';
import DateSelector from '../AddProduct/DateSelector';
import QuantitySelector from '../AddProduct/QuantitySelector';
import { CATEGORIES, LOCATIONS, ProductCategory, ProductLocation } from '../../../constants/productConstants';
import './EditProductForm.css';

interface EditProductFormProps {
  productId: string;
  initialData: {
    name: string;
    expiryDate: string;
    quantity: number;
    category?: ProductCategory;
    location: ProductLocation;
    notes?: string;
    sharedWith?: string[];
  };
  sharedUsers: { userId: string; email: string }[];
  onSuccess: () => void;
}

const EditProductForm: React.FC<EditProductFormProps> = ({
  productId,
  initialData,
  sharedUsers,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  
  // Form state
  const [name, setName] = useState(initialData.name);
  const [expiryDate, setExpiryDate] = useState(initialData.expiryDate);
  const [quantity, setQuantity] = useState(initialData.quantity.toString());
  const [category, setCategory] = useState<ProductCategory | ''>(initialData.category || '');
  const [location, setLocation] = useState<ProductLocation>(initialData.location);
  const [notes, setNotes] = useState(initialData.notes || '');
  const [selectedSharedUsers, setSelectedSharedUsers] = useState<string[]>(initialData.sharedWith || []);
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(initialData.expiryDate);
  const [isCustomQuantity, setIsCustomQuantity] = useState(false);

  // Input value refs
  const inputValues = useRef({
    name: initialData.name,
    quantity: initialData.quantity.toString(),
    notes: initialData.notes || '',
  });

  const validateForm = (): boolean => {
    const currentName = inputValues.current.name || name;
    const currentQuantity = inputValues.current.quantity || quantity;

    if (!currentName.trim()) {
      setValidationError(t('validation.nameRequired'));
      return false;
    }
    if (!expiryDate) {
      setValidationError(t('validation.expiryRequired'));
      return false;
    }
    if (!currentQuantity || Number(currentQuantity) < 1) {
      setValidationError(t('validation.quantityRequired'));
      return false;
    }
    return true;
  };

  const handleDateChange = (value: string | string[] | null | undefined) => {
    if (value) {
      let dateStr: string;
      if (Array.isArray(value)) {
        dateStr = value[0] || new Date().toISOString();
      } else {
        dateStr = value;
      }

      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const formattedDate = date.toISOString().split('T')[0];
        setSelectedDate(dateStr);
        setExpiryDate(formattedDate);
      }
    }
  };

  const handleInputChange = (field: keyof typeof inputValues.current, value: string) => {
    inputValues.current[field] = value;
    switch (field) {
      case 'name':
        setName(value);
        break;
      case 'quantity':
        setQuantity(value);
        break;
      case 'notes':
        setNotes(value);
        break;
    }
  };

  const handleQuantityChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomQuantity(true);
      setQuantity('');
      inputValues.current.quantity = '';
    } else {
      setIsCustomQuantity(false);
      setQuantity(value);
      inputValues.current.quantity = value;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    setName(inputValues.current.name || name);
    setQuantity(inputValues.current.quantity || quantity);
    setNotes(inputValues.current.notes || notes);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const productData = {
        name: (inputValues.current.name || name).trim(),
        expiryDate,
        quantity: Number(inputValues.current.quantity || quantity),
        location,
        notes: (inputValues.current.notes || notes).trim(),
        ...(category ? { category } : {}),
        sharedWith: selectedSharedUsers
      };

      await updateProduct(productId, productData);
      setSuccess(true);
      onSuccess();
    } catch (error) {
      console.error('Error updating product:', error);
      setError(t('errors.productUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('products.edit')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {validationError && (
            <IonItem lines="none">
              <IonText color="danger">
                <p className="ion-no-margin">{validationError}</p>
              </IonText>
            </IonItem>
          )}

          <IonItem>
            <IonLabel position="stacked">{t('products.name')}</IonLabel>
            <IonInput
              value={name}
              placeholder={t('products.enterName')}
              onIonInput={e => handleInputChange('name', e.detail.value || '')}
            />
          </IonItem>

          <DateSelector
            expiryDate={expiryDate}
            selectedDate={selectedDate}
            isOpen={isDatePickerOpen}
            onOpen={() => setIsDatePickerOpen(true)}
            onCancel={() => {
              setSelectedDate(expiryDate);
              setIsDatePickerOpen(false);
            }}
            onConfirm={() => {
              if (!selectedDate && !expiryDate) {
                const today = new Date();
                const formattedDate = today.toISOString().split('T')[0];
                setExpiryDate(formattedDate);
              }
              setIsDatePickerOpen(false);
            }}
            onDateChange={handleDateChange}
          />

          <IonItem>
            <IonLabel position="stacked">{t('products.location')}</IonLabel>
            <IonSelect
              value={location}
              placeholder={t('products.selectLocation')}
              onIonChange={e => setLocation(e.detail.value)}
            >
              {LOCATIONS.map((loc: ProductLocation) => (
                <IonSelectOption key={loc} value={loc}>
                  {t(`locations.${loc}`)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <QuantitySelector
            quantity={quantity}
            isCustomQuantity={isCustomQuantity}
            onQuantityChange={handleQuantityChange}
            onCustomQuantityChange={value => handleInputChange('quantity', value)}
          />

          <IonItem>
            <IonLabel position="stacked">
              {t('products.category')} ({t('common.optional')})
            </IonLabel>
            <IonSelect
              value={category}
              placeholder={t('products.selectCategory')}
              onIonChange={e => setCategory(e.detail.value)}
            >
              {CATEGORIES.map((cat: ProductCategory) => (
                <IonSelectOption key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {sharedUsers.length > 0 && (
            <IonItem>
              <IonLabel position="stacked">
                {t('products.sharedWith')} ({t('common.optional')})
              </IonLabel>
              <IonSelect
                value={selectedSharedUsers}
                placeholder={t('products.selectSharedWith')}
                onIonChange={e => setSelectedSharedUsers(e.detail.value)}
                multiple={true}
              >
                {sharedUsers.map(user => (
                  <IonSelectOption key={user.userId} value={user.userId}>
                    {user.email}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          )}

          <IonItem>
            <IonLabel position="stacked">
              {t('products.notes')} ({t('common.optional')})
            </IonLabel>
            <IonTextarea
              value={notes}
              placeholder={t('products.enterNotes')}
              onIonInput={e => handleInputChange('notes', e.detail.value || '')}
            />
          </IonItem>

          <IonButton
            expand="block"
            type="submit"
            className="ion-margin-top"
            disabled={isLoading}
          >
            {isLoading ? (
              <IonSpinner name="crescent" />
            ) : (
              t('common.save')
            )}
          </IonButton>
        </IonCardContent>
      </IonCard>

      <IonToast
        isOpen={!!error}
        message={error}
        duration={3000}
        color="danger"
        onDidDismiss={() => setError('')}
      />

      <IonToast
        isOpen={success}
        message={t('products.updateSuccess')}
        duration={2000}
        color="success"
        onDidDismiss={() => setSuccess(false)}
      />
    </form>
  );
};

export default EditProductForm;
