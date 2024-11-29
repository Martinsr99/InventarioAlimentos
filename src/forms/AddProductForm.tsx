import React, { useRef, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonButton,
  IonSelect,
  IonSelectOption,
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
import ProductSuggestions from '../components/Products/AddProduct/ProductSuggestions';
import './AddProductForm.css';

const CATEGORIES = [
  'dairy',
  'meat',
  'vegetables',
  'fruits',
  'grains',
  'beverages',
  'snacks',
  'other'
] as const;

const LOCATIONS = [
  'fridge',
  'freezer',
  'pantry',
  'other'
] as const;

interface AddProductFormProps {
  onProductAdded?: () => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onProductAdded }) => {
  const { t } = useLanguage();
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

    setIsLoading(true);

    try {
      await submitProductForm({
        name: inputValues.current.name || formState.name,
        expiryDate: formState.expiryDate,
        quantity: Number(inputValues.current.quantity || formState.quantity),
        location: formState.location,
        notes: (inputValues.current.notes || formState.notes),
        category: formState.category,
        sharedWith: formState.selectedSharedUsers
      });
      
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

          <IonItem>
            <IonLabel position="stacked">{t('products.location')}</IonLabel>
            <IonSelect
              value={formState.location}
              placeholder={t('products.selectLocation')}
              onIonChange={e => setFormValue('location', e.detail.value)}
            >
              {LOCATIONS.map(loc => (
                <IonSelectOption key={loc} value={loc}>
                  {t(`locations.${loc}`)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <QuantitySelector
            quantity={formState.quantity}
            isCustomQuantity={isCustomQuantity}
            onQuantityChange={handleQuantityChange}
            onCustomQuantityChange={value => handleInputChange('quantity', value)}
          />

          <IonItem>
            <IonLabel position="stacked">
              {t('products.category')} ({t('common.optional')})
            </IonLabel>
            <IonSelect
              value={formState.category}
              placeholder={t('products.selectCategory')}
              onIonChange={e => setFormValue('category', e.detail.value)}
            >
              {CATEGORIES.map(cat => (
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
                value={formState.selectedSharedUsers}
                placeholder={t('products.selectSharedWith')}
                onIonChange={e => setFormValue('selectedSharedUsers', e.detail.value)}
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
