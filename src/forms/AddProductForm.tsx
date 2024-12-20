import React, { useRef, useEffect, useState } from 'react';
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
  IonAlert,
  AlertInput,
} from '@ionic/react';
import { useLanguage } from '../contexts/LanguageContext';
import { getAcceptedShareUsers } from '../services/FriendService';
import { submitProductForm, checkForDuplicateProduct } from '../services/ProductFormService';
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

interface DuplicateDialogState {
  isOpen: boolean;
  existingQuantity?: number;
  newQuantity?: number;
  totalQuantity?: number;
  productId?: string;
  adjustedQuantity?: number;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onProductAdded }) => {
  const { t, language } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<{ userId: string; email: string }[]>([]);
  const [duplicateDialog, setDuplicateDialog] = useState<DuplicateDialogState>({
    isOpen: false
  });

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
        try {
          const users = await getAcceptedShareUsers(auth.currentUser);
          console.log('Loaded shared users for AddProductForm:', users);
          setSharedUsers(users);
        } catch (error) {
          console.error('Error loading shared users:', error);
        }
      }
    };
    loadSharedUsers();

    // Set up an interval to periodically check for new friends
    const interval = setInterval(loadSharedUsers, 5000);
    return () => clearInterval(interval);
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

      const duplicateCheck = await checkForDuplicateProduct(productData);
      
      if (duplicateCheck.isDuplicate && duplicateCheck.existingProduct) {
        setDuplicateDialog({
          isOpen: true,
          existingQuantity: duplicateCheck.existingProduct.quantity,
          newQuantity: productData.quantity,
          totalQuantity: duplicateCheck.totalQuantity,
          productId: duplicateCheck.existingProduct.id,
          adjustedQuantity: duplicateCheck.totalQuantity
        });
        setIsLoading(false);
        return;
      }

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

  const handleDuplicateConfirm = async (updateQuantity: boolean) => {
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

      if (updateQuantity) {
        await submitProductForm(
          productData,
          language,
          duplicateDialog.adjustedQuantity,
          false // Not forcing separate
        );
      } else {
        await submitProductForm(
          productData,
          language,
          undefined,
          true // Force separate
        );
      }

      if (onProductAdded) {
        onProductAdded();
      }

      setSuccess(true);
      resetForm();
    } catch (error) {
      console.error('Error handling duplicate product:', error);
      setError(t('errors.productAdd'));
    } finally {
      setIsLoading(false);
      setDuplicateDialog({ isOpen: false });
    }
  };

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="form-container">
      <IonCard className="form-section">
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

      <IonAlert
        isOpen={duplicateDialog.isOpen}
        header={t('products.duplicateFound')}
        message={t('products.duplicateMessage', {
          existingQuantity: duplicateDialog.existingQuantity,
          newQuantity: duplicateDialog.newQuantity,
          totalQuantity: duplicateDialog.totalQuantity
        })}
        inputs={[
          {
            name: 'quantity',
            type: 'number',
            placeholder: t('products.quantity'),
            value: duplicateDialog.adjustedQuantity?.toString(),
            min: 1,
            handler: (input: AlertInput) => {
              setDuplicateDialog(prev => ({
                ...prev,
                adjustedQuantity: Number(input.value)
              }));
            }
          }
        ]}
        buttons={[
          {
            text: t('products.keepSeparate'),
            role: 'cancel',
            handler: () => handleDuplicateConfirm(false)
          },
          {
            text: t('products.updateQuantity'),
            handler: () => handleDuplicateConfirm(true)
          }
        ]}
        onDidDismiss={() => setDuplicateDialog({ isOpen: false })}
      />

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
