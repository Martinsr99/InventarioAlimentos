import React, { useState, useEffect } from 'react';
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

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { t } = useLanguage();
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

      await updateProduct(id, productData);
      setSuccess(true);
      setTimeout(() => {
        history.goBack();
      }, 1500);
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
        <form onSubmit={handleSubmit}>
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
          message={t('products.addSuccess')}
          duration={2000}
          color="success"
          onDidDismiss={() => setSuccess(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default EditProduct;
