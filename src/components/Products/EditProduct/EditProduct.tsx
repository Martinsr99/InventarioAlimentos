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
  IonText
} from '@ionic/react';
import { getAcceptedShareUsers } from '../../../services/FriendService';
import { useLanguage } from '../../../contexts/LanguageContext';
import { auth } from '../../../firebaseConfig';
import { useEditProductForm } from '../../../hooks/useEditProductForm';
import DateSelector from '../AddProduct/DateSelector';
import QuantitySelector from '../AddProduct/QuantitySelector';
import { saveOutline } from 'ionicons/icons';
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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<{ userId: string; email: string }[]>([]);
  const {
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
    handleSubmit,
    setSelectedDate,
    setValidationError
  } = useEditProductForm(productId, onSaved);

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

  if (isLoading) {
    return (
      <div className="loading-container">
        <IonSpinner />
      </div>
    );
  }

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
        disabled={isLoading}
      >
        <IonIcon icon={saveOutline} slot="start" />
        {t('products.save')}
      </IonButton>

      <IonToast
        isOpen={!!error}
        message={error || ''}
        duration={3000}
        color="danger"
      />

      <IonToast
        isOpen={success}
        message={t('products.updateSuccess')}
        duration={2000}
        color="success"
      />
    </form>
  );
};

export default EditProduct;
