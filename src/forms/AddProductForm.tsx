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
  IonText
} from '@ionic/react';
import { addProduct } from '../services/InventoryService';
import { useLanguage } from '../contexts/LanguageContext';

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

const AddProductForm: React.FC = () => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const resetForm = () => {
    setName('');
    setExpiryDate('');
    setQuantity('');
    setCategory('');
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
    if (!category) {
      setValidationError(t('validation.categoryRequired'));
      return false;
    }
    return true;
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
      await addProduct({
        name: name.trim(),
        expiryDate,
        quantity: Number(quantity),
        category,
        notes: notes.trim() || undefined
      });
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

          <IonItem>
            <IonLabel position="stacked">{t('products.expiryDate')}</IonLabel>
            <IonInput
              type="date"
              value={expiryDate}
              placeholder={t('products.selectDate')}
              onIonChange={e => setExpiryDate(e.detail.value!)}
            />
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
            <IonLabel position="stacked">{t('products.category')}</IonLabel>
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

          <IonItem>
            <IonLabel position="stacked">{t('products.notes')}</IonLabel>
            <IonTextarea
              value={notes}
              placeholder={t('products.enterNotes')}
              onIonChange={e => setNotes(e.detail.value!)}
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
