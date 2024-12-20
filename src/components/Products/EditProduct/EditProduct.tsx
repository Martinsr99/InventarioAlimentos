import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonToast,
  IonText,
  IonPage,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle
} from '@ionic/react';
import { getAcceptedShareUsers } from '../../../services/FriendService';
import { useLanguage } from '../../../contexts/LanguageContext';
import { auth, db } from '../../../firebaseConfig';
import { useEditProductForm } from '../../../hooks/useEditProductForm';
import { submitProductEdit } from '../../../services/EditProductService';
import DateSelector from '../AddProduct/DateSelector';
import QuantitySelector from '../AddProduct/QuantitySelector';
import { saveOutline } from 'ionicons/icons';
import { doc, getDoc } from 'firebase/firestore';
import './EditProductForm.css';

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

interface EditProductProps {
  productId: string;
  onSaved?: () => void;
}

export const EditProduct: React.FC<EditProductProps> = ({ productId, onSaved }) => {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [productData, setProductData] = useState<any>(null);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        setLoadError(t('errors.invalidProductId'));
        setIsLoading(false);
        return;
      }

      try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          setProductData(productSnap.data());
        } else {
          setLoadError(t('errors.productNotFound'));
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setLoadError(t('errors.productLoad'));
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [productId, t]);

  if (isLoading) {
    return (
      <IonPage>
        <IonContent>
          <div className="loading-container">
            <IonSpinner />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (loadError || !productData) {
    return (
      <IonPage>
        <IonContent>
          <div className="error-container">
            <IonText color="danger">{loadError}</IonText>
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
        <EditProductForm
          productId={productId}
          initialData={{
            name: productData.name,
            expiryDate: productData.expiryDate,
            quantity: productData.quantity,
            category: productData.category,
            location: productData.location,
            notes: productData.notes,
            sharedWith: productData.sharedWith
          }}
          onSaved={onSaved}
        />
      </IonContent>
    </IonPage>
  );
};

interface EditProductFormProps {
  productId: string;
  initialData: {
    name: string;
    expiryDate: string;
    quantity: number;
    category?: typeof CATEGORIES[number];
    location: typeof LOCATIONS[number];
    notes?: string;
    sharedWith?: string[];
  };
  onSaved?: () => void;
}

const EditProductForm: React.FC<EditProductFormProps> = ({
  productId,
  initialData,
  onSaved
}) => {
  const { t } = useLanguage();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<{ userId: string; email: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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
    setSubmitError(null);
    setValidationError('');

    const validationResult = validation.validateForm();
    if (!validationResult.isValid) {
      setValidationError(validationResult.error || '');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitProductEdit(productId, {
        name: inputValues.current.name || formState.name,
        expiryDate: formState.expiryDate,
        quantity: Number(inputValues.current.quantity || formState.quantity),
        location: formState.location,
        notes: inputValues.current.notes || formState.notes,
        category: formState.category || undefined,
        sharedWith: formState.selectedSharedUsers
      });
      
      setSubmitSuccess(true);
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error('Error updating product:', error);
      setSubmitError(t('errors.productUpdate'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-product-form">
      {validationError && (
        <IonItem lines="none">
          <IonText color="danger">
            <p className="ion-no-margin">{validationError}</p>
          </IonText>
        </IonItem>
      )}

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
        />
      </IonItem>

      <IonButton
        expand="block"
        type="submit"
        className="ion-margin-top"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <IonSpinner name="crescent" />
        ) : (
          <>
            <IonIcon icon={saveOutline} slot="start" />
            {t('products.save')}
          </>
        )}
      </IonButton>

      <IonToast
        isOpen={!!submitError}
        message={submitError || ''}
        duration={3000}
        color="danger"
      />

      <IonToast
        isOpen={submitSuccess}
        message={t('products.updateSuccess')}
        duration={2000}
        color="success"
      />
    </form>
  );
};

export default EditProduct;
