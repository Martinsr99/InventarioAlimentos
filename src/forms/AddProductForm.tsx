import React, { useRef, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonButton,
  IonTextarea,
  IonToast,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAcceptedShareUsers } from '../services/FriendService';
import { submitProductForm } from '../services/ProductFormService';
import { auth } from '../firebaseConfig';
import { useProductForm } from '../hooks/useProductForm';
import DateSelector from '../components/Products/AddProduct/DateSelector';
import QuantitySelector from '../components/Products/AddProduct/QuantitySelector';
import LocationSelector from '../components/Products/AddProduct/LocationSelector';
import CategorySelector from '../components/Products/AddProduct/CategorySelector';
import SharedUsersSelector from '../components/Products/AddProduct/SharedUsersSelector';
import ProductSuggestions from '../components/Products/AddProduct/ProductSuggestions';
import './AddProductForm.css';

interface AddProductFormProps {
  onProductAdded?: () => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onProductAdded }) => {
  const { t, language } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [sharedUsers, setSharedUsers] = React.useState<{ userId: string; email: string }[]>([]);

  const {
    formState,
    suggestions,
    showSuggestions,
    isCustomQuantity,
    validationError,
    selectedDate,
    isLoadingSuggestions,
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
  } = useProductForm();

  useEffect(() => {
    const loadSharedUsers = async () => {
      if (auth.currentUser) {
        const users = await getAcceptedShareUsers(auth.currentUser);
        setSharedUsers(users);
      }
    };
    loadSharedUsers();
  }, []);

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
        setFormValue('expiryDate', formattedDate);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    const validationResult = validation.validateForm();
    if (!validationResult.isValid) {
      setValidationError(validationResult.error || '');
      return;
    }

    // Set default category if none selected
    if (!formState.category) {
      setFormValue('category', 'other');
    }

    setIsLoading(true);

    try {
      const productData = {
        name: inputValues.current.name || formState.name,
        expiryDate: formState.expiryDate,
        quantity: Number(inputValues.current.quantity || formState.quantity),
        location: formState.location,
        notes: (inputValues.current.notes || formState.notes),
        category: formState.category || 'other',
        sharedWith: formState.selectedSharedUsers
      };

      await submitProductForm(productData, language);
      
      if (onProductAdded) {
        onProductAdded();
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      setSuccess(true);
      resetForm();
    } catch (error) {
      console.error('Error adding product:', error);
      setError(t('errors.productAdd'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef}>
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>{t('products.add')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {validationError && (
            <IonItem lines="none">
              <IonText color="danger">
                <p className="ion-no-margin">{validationError}</p>
              </IonText>
            </IonItem>
          )}

          <ProductSuggestions
            name={formState.name}
            showSuggestions={showSuggestions}
            suggestions={suggestions}
            isLoading={isLoadingSuggestions}
            onNameChange={value => handleInputChange('name', value)}
            onSuggestionClick={handleSuggestionClick}
            onInputBlur={() => {
              setTimeout(() => {
                setShowSuggestions(false);
              }, 200);
            }}
            onInputFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
          />

          <DateSelector
            expiryDate={formState.expiryDate}
            selectedDate={selectedDate}
            isOpen={isDatePickerOpen}
            onOpen={() => setIsDatePickerOpen(true)}
            onCancel={() => {
              setSelectedDate(formState.expiryDate);
              setIsDatePickerOpen(false);
            }}
            onConfirm={() => {
              if (!selectedDate && !formState.expiryDate) {
                const today = new Date();
                const formattedDate = today.toISOString().split('T')[0];
                setFormValue('expiryDate', formattedDate);
              }
              setIsDatePickerOpen(false);
            }}
            onDateChange={handleDateChange}
          />

          <LocationSelector
            location={formState.location}
            onLocationChange={value => setFormValue('location', value)}
          />

          <QuantitySelector
            quantity={formState.quantity}
            isCustomQuantity={isCustomQuantity}
            onQuantityChange={handleQuantityChange}
            onCustomQuantityChange={value => handleInputChange('quantity', value)}
          />

          <CategorySelector
            category={formState.category}
            onCategoryChange={value => setFormValue('category', value)}
          />

          {sharedUsers.length > 0 && (
            <SharedUsersSelector
              users={sharedUsers}
              selectedUsers={formState.selectedSharedUsers}
              onUsersChange={value => setFormValue('selectedSharedUsers', value)}
            />
          )}

          <IonItem>
            <IonLabel position="stacked">
              {t('products.notes')} ({t('common.optional')})
            </IonLabel>
            <IonTextarea
              value={formState.notes}
              placeholder={t('products.enterNotes')}
              onIonInput={e => handleInputChange('notes', e.detail.value || '')}
              onIonBlur={() => {
                const textarea = formRef.current?.querySelector('ion-textarea') as HTMLIonTextareaElement;
                handleInputChange('notes', textarea?.value?.toString() || '');
              }}
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
              t('products.save')
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
        message={t('products.addSuccess')}
        duration={2000}
        color="success"
        onDidDismiss={() => setSuccess(false)}
      />
    </form>
  );
};

export default AddProductForm;
