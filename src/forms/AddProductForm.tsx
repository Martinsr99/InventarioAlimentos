import React, { useState, useRef, useEffect } from 'react';
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
  IonList,
} from '@ionic/react';
import { addProduct } from '../services/InventoryService';
import { useLanguage } from '../contexts/LanguageContext';
import { searchPredefinedProducts, getCategoryForProduct, PredefinedProduct } from '../services/PredefinedProductsService';
import { getAcceptedShareUsers } from '../services/SharedProductsService';
import { auth } from '../firebaseConfig';
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

const QUANTITIES = ['1', '2', '3', '4', '5','6','7','8','9','10'];

interface AddProductFormProps {
  onProductAdded?: () => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onProductAdded }) => {
  const { t, language } = useLanguage();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState('');
  const [suggestions, setSuggestions] = useState<PredefinedProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
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
  const [isCustomQuantity, setIsCustomQuantity] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<{ userId: string; email: string }[]>([]);
  const [selectedSharedUsers, setSelectedSharedUsers] = useState<string[]>([]);

  // Refs to store the latest input values
  const inputValues = useRef({
    name: '',
    quantity: '1',
    notes: '',
  });

  useEffect(() => {
    if (name.trim().length > 0) {
      const results = searchPredefinedProducts(name, language);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [name, language]);

  useEffect(() => {
    const loadSharedUsers = async () => {
      if (auth.currentUser) {
        const users = await getAcceptedShareUsers(auth.currentUser);
        setSharedUsers(users);
      }
    };
    loadSharedUsers();
  }, []);

  const handleSuggestionClick = (suggestion: PredefinedProduct) => {
    setName(suggestion.name);
    inputValues.current.name = suggestion.name;
    setCategory(suggestion.category);
    setShowSuggestions(false);
  };

  const resetForm = () => {
    setName('');
    setExpiryDate('');
    setSelectedDate('');
    setQuantity('1');
    setCategory('');
    setLocation('fridge');
    setNotes('');
    setValidationError('');
    setIsCustomQuantity(false);
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedSharedUsers([]);
    inputValues.current = {
      name: '',
      quantity: '1',
      notes: '',
    };
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
        setExpiryDate(formattedDate);
      }
    }
  };

  const confirmDate = () => {
    if (!selectedDate && !expiryDate) {
      const today = new Date();
      const formattedDate = today.toISOString().split('T')[0];
      setExpiryDate(formattedDate);
    }
    setIsDatePickerOpen(false);
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
        ...(category ? { category } : {}),
        sharedWith: selectedSharedUsers
      };

      await addProduct(productData);
      
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

  const handleQuantityChange = (value: string) => {
    if (value === 'custom') {
      setIsCustomQuantity(true);
      setQuantity('');
      inputValues.current.quantity = '';
    } else {
      setIsCustomQuantity(false);
      setQuantity(value);
      inputValues.current.quantity = value;
    }
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

          <div className="product-name-container">
            <IonItem>
              <IonLabel position="stacked">{t('products.name')}</IonLabel>
              <IonInput
                value={name}
                placeholder={t('products.enterName')}
                onIonInput={e => handleInputChange('name', e.detail.value || '')}
                onIonBlur={() => {
                  setTimeout(() => {
                    setShowSuggestions(false);
                  }, 200);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
              />
            </IonItem>
            
            {showSuggestions && suggestions.length > 0 && (
              <IonList className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <IonItem
                    key={index}
                    button
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="suggestion-item"
                  >
                    <IonLabel>{suggestion.name}</IonLabel>
                  </IonItem>
                ))}
              </IonList>
            )}
          </div>

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
            mode="ios"
            backdropDismiss={false}
            animated={true}
          >
            <IonContent className="ion-padding">
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
              <IonDatetime
                value={selectedDate || expiryDate || new Date().toISOString()}
                onIonChange={e => handleDateChange(e.detail.value)}
                presentation="date"
                preferWheel={true}
                showDefaultButtons={false}
                firstDayOfWeek={1}
                locale="es-ES"
                className="custom-datetime"
                min={new Date().toISOString().split('T')[0]}
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
            {!isCustomQuantity ? (
              <IonSelect
                value={quantity}
                placeholder={t('products.selectQuantity')}
                onIonChange={e => handleQuantityChange(e.detail.value)}
              >
                {QUANTITIES.map(q => (
                  <IonSelectOption key={q} value={q}>
                    {q}
                  </IonSelectOption>
                ))}
                <IonSelectOption value="custom">{t('common.custom')}</IonSelectOption>
              </IonSelect>
            ) : (
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
            )}
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

          {sharedUsers.length > 0 && (
            <IonItem>
              <IonLabel position="stacked">
                {t('products.sharedWith')} ({t('common.optional')})
              </IonLabel>
              <IonSelect
                value={selectedSharedUsers}
                placeholder={t('products.selectSharedWith')}
                onIonChange={e => setSelectedSharedUsers(e.detail.value)}
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
              value={notes}
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
