import React, { useRef } from 'react';
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
import { useLanguage } from '../../../contexts/LanguageContext';
import { useEditProductForm } from '../../../hooks/useEditProductForm';
import { submitProductEdit } from '../../../services/EditProductService';
import { CATEGORIES, LOCATIONS, ProductCategory, ProductLocation } from '../../../constants/productConstants';
import DateSelector from '../AddProduct/DateSelector';
import QuantitySelector from '../AddProduct/QuantitySelector';
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
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    formState,
    isCustomQuantity,
    validationError,
    selectedDate,
    inputValues,
    setFormValue,
    handleQuantityChange,
    handleInputChange,
    validation,
    setSelectedDate,
    setValidationError
  } = useEditProductForm(initialData);

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
      await submitProductEdit(productId, {
        name: inputValues.current.name || formState.name,
        expiryDate: formState.expiryDate,
        quantity: Number(inputValues.current.quantity || formState.quantity),
        location: formState.location,
        notes: (inputValues.current.notes || formState.notes),
        category: formState.category || undefined,
        sharedWith: formState.selectedSharedUsers
      });
      
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
              value={formState.name}
              placeholder={t('products.enterName')}
              onIonInput={e => handleInputChange('name', e.detail.value || '')}
            />
          </IonItem>

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
              {LOCATIONS.map((loc: ProductLocation) => (
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
