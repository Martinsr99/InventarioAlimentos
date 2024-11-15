import React, { useState } from 'react';
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
  IonDatetime,
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  DatetimeChangeEventDetail
} from '@ionic/react';
import { addProduct } from '../services/InventoryService';
import { useLanguage } from '../contexts/LanguageContext';
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
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('fridge');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const resetForm = () => {
    setName('');
    setExpiryDate('');
    setSelectedDate('');
    setQuantity('1');
    setCategory('');
    setLocation('fridge');
    setNotes('');
    setValidationError('');
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setValidationError(t('validation.nameRequired'));
      return false;
    }
    if (!expiryDate) {
      setValidationError(t('validation.expiryRequired'));
      return false;
    }
    if (!quantity || Number(quantity) < 1) {
      setValidationError(t('validation.quantityRequired'));
      return false;
    }
    return true;
  };

  const handleDateChange = (value: string | string[] | null | undefined) => {
    if (typeof value === 'string') {
      setSelectedDate(value);
    }
  };

  const confirmDate = () => {
    if (selectedDate) {
      const date = new Date(selectedDate);
      const formattedDate = date.toISOString().split('T')[0];
      setExpiryDate(formattedDate);
      setIsDatePickerOpen(false);
    }
  };

  const cancelDate = () => {
    setSelectedDate(expiryDate);
    setIsDatePickerOpen(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const trimmedNotes = notes.trim();
      const productData = {
        name: name.trim(),
        expiryDate,
        quantity: Number(quantity),
        location,
        ...(category ? { category } : {}),
        ...(trimmedNotes ? { notes: trimmedNotes } : {})
      };

      await addProduct(productData);
      setSuccess(true);
      resetForm();
      if (onProductAdded) {
        onProductAdded();
      }
    } catch (error) {
      console.error('Error adding product:', error);
      setError(t('errors.productAdd'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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

          <IonItem>
            <IonLabel position="stacked">{t('products.name')}</IonLabel>
            <IonInput
              value={name}
              placeholder={t('products.enterName')}
              onIonChange={e => setName(e.detail.value!)}
            />
          </IonItem>

          <IonItem button onClick={() => setIsDatePickerOpen(true)}>
            <IonLabel position="stacked">{t('products.expiryDate')}</IonLabel>
            <IonInput
              readonly
              value={formatDisplayDate(expiryDate)}
              placeholder={t('products.selectDate')}
            />
          </IonItem>

          <IonModal 
            isOpen={isDatePickerOpen}
            onDidDismiss={cancelDate}
            className="date-picker-modal"
            breakpoints={[0, 0.5, 1]}
            initialBreakpoint={0.5}
          >
            <IonHeader>
              <IonToolbar>
                <IonButtons slot="start">
                  <IonButton onClick={cancelDate}>
                    {t('common.cancel')}
                  </IonButton>
                </IonButtons>
                <IonTitle>{t('products.expiryDate')}</IonTitle>
                <IonButtons slot="end">
                  <IonButton strong={true} onClick={confirmDate}>
                    {t('common.ok')}
                  </IonButton>
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent>
              <IonDatetime
                value={selectedDate || expiryDate}
                onIonChange={e => handleDateChange(e.detail.value)}
                presentation="date"
                preferWheel={true}
                showDefaultButtons={false}
                firstDayOfWeek={1}
                locale="es-ES"
                className="custom-datetime"
                min={new Date().toISOString().split('T')[0]}
                size="cover"
              />
            </IonContent>
          </IonModal>

          <IonItem>
            <IonLabel position="stacked">{t('products.location')}</IonLabel>
            <IonSelect
              value={location}
              placeholder={t('products.selectLocation')}
              onIonChange={e => setLocation(e.detail.value)}
            >
              {LOCATIONS.map(loc => (
                <IonSelectOption key={loc} value={loc}>
                  {t(`locations.${loc}`)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">{t('products.quantity')}</IonLabel>
            <IonInput
              type="number"
              value={quantity}
              placeholder={t('products.enterQuantity')}
              onIonChange={e => setQuantity(e.detail.value!)}
              min="1"
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">{t('products.notes')}</IonLabel>
            <IonTextarea
              value={notes}
              placeholder={t('products.enterNotes')}
              onIonChange={e => setNotes(e.detail.value!)}
            />
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">
              {t('products.category')} ({t('common.optional')})
            </IonLabel>
            <IonSelect
              value={category}
              placeholder={t('products.selectCategory')}
              onIonChange={e => setCategory(e.detail.value)}
            >
              {CATEGORIES.map(cat => (
                <IonSelectOption key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </IonSelectOption>
              ))}
            </IonSelect>
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
