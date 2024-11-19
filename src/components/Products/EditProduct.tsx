import React, { useState, useEffect, useRef } from 'react';
import { useParams, useHistory } from 'react-router-dom';
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
  DatetimeChangeEventDetail,
  IonBackButton,
  IonPage
} from '@ionic/react';
import { getProducts, updateProduct } from '../../services/InventoryService';
import { useLanguage } from '../../contexts/LanguageContext';
import '../../forms/AddProductForm.css';

interface EditProductProps {
  onProductUpdated?: () => void;
}

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

const EditProduct: React.FC<EditProductProps> = ({ onProductUpdated }) => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { t } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('fridge');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Refs to store the latest input values
  const inputValues = useRef({
    name: '',
    quantity: '1',
    notes: '',
  });

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const products = await getProducts();
      const product = products.find(p => p.id === id);
      if (product) {
        setName(product.name);
        setExpiryDate(product.expiryDate);
        setQuantity(product.quantity.toString());
        setCategory(product.category || '');
        setLocation(product.location);
        setNotes(product.notes || '');
        // Initialize input values ref
        inputValues.current = {
          name: product.name,
          quantity: product.quantity.toString(),
          notes: product.notes || '',
        };
      } else {
        history.replace('/');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      setError(t('errors.productLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    // Synchronize the latest input values
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

  const handleDateChange = (event: CustomEvent<DatetimeChangeEventDetail>) => {
    const value = event.detail.value;
    if (typeof value === 'string') {
      const date = new Date(value);
      const formattedDate = date.toISOString().split('T')[0];
      setExpiryDate(formattedDate);
      setIsDatePickerOpen(false);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleInputChange = (field: keyof typeof inputValues.current, value: string) => {
    inputValues.current[field] = value;
    // Also update the state for immediate UI feedback
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationError('');

    // Synchronize the latest input values with state
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
        ...(category ? { category } : {})
      };

      await updateProduct(id, productData);
      setSuccess(true);
      
      if (onProductUpdated) {
        onProductUpdated();
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      history.replace('/');
    } catch (error) {
      console.error('Error updating product:', error);
      setError(t('errors.productUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div className="ion-text-center">
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>{t('products.edit')}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
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
                  onIonBlur={() => {
                    const input = formRef.current?.querySelector('ion-input[placeholder="' + t('products.enterName') + '"]') as HTMLIonInputElement;
                    handleInputChange('name', input?.value?.toString() || '');
                  }}
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
                onDidDismiss={() => setIsDatePickerOpen(false)}
                className="date-picker-modal"
                breakpoints={[0, 1]}
                initialBreakpoint={1}
              >
                <IonHeader>
                  <IonToolbar>
                    <IonTitle>{t('products.expiryDate')}</IonTitle>
                    <IonButtons slot="end">
                      <IonButton onClick={() => setIsDatePickerOpen(false)}>
                        {t('common.cancel')}
                      </IonButton>
                    </IonButtons>
                  </IonToolbar>
                </IonHeader>
                <IonContent>
                  <IonDatetime
                    value={expiryDate}
                    onIonChange={handleDateChange}
                    presentation="date"
                    preferWheel={false}
                    showDefaultButtons={true}
                    doneText={t('common.ok')}
                    cancelText={t('common.cancel')}
                    firstDayOfWeek={1}
                    locale="es-ES"
                    className="custom-datetime"
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
                  onIonInput={e => handleInputChange('quantity', e.detail.value || '1')}
                  onIonBlur={() => {
                    const input = formRef.current?.querySelector('ion-input[placeholder="' + t('products.enterQuantity') + '"]') as HTMLIonInputElement;
                    handleInputChange('quantity', input?.value?.toString() || '1');
                  }}
                  min="1"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">{t('products.notes')}</IonLabel>
                <IonTextarea
                  value={notes}
                  placeholder={t('products.enterNotes')}
                  onIonInput={e => handleInputChange('notes', e.detail.value || '')}
                  onIonBlur={() => {
                    const textarea = formRef.current?.querySelector('ion-textarea') as HTMLIonTextareaElement;
                    handleInputChange('notes', textarea?.value?.toString() || '');
                  }}
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
                  t('common.save')
                )}
              </IonButton>
            </IonCardContent>
          </IonCard>
        </form>

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
      </IonContent>
    </IonPage>
  );
};

export default EditProduct;
