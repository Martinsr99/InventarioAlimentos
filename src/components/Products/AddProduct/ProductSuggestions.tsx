import React from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { PredefinedProduct } from '../../../services/PredefinedProductsService';
import { useLanguage } from '../../../contexts/LanguageContext';
import './ProductSuggestions.css';

interface ProductSuggestionsProps {
  name: string;
  showSuggestions: boolean;
  suggestions: PredefinedProduct[];
  isLoading?: boolean;
  onNameChange: (value: string) => void;
  onSuggestionClick: (suggestion: PredefinedProduct) => void;
  onInputBlur: () => void;
  onInputFocus: () => void;
}

const ProductSuggestions: React.FC<ProductSuggestionsProps> = ({
  name,
  showSuggestions,
  suggestions,
  isLoading = false,
  onNameChange,
  onSuggestionClick,
  onInputBlur,
  onInputFocus,
}) => {
  const { t } = useLanguage();

  return (
    <div className="product-name-container">
      <IonItem>
        <IonLabel position="stacked">{t('products.name')}</IonLabel>
        <IonInput
          value={name}
          placeholder={t('products.enterName')}
          onIonInput={e => onNameChange(e.detail.value || '')}
          onIonBlur={onInputBlur}
          onFocus={onInputFocus}
        />
        {isLoading && (
          <div className="suggestions-loading">
            <IonSpinner name="crescent" />
          </div>
        )}
      </IonItem>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => onSuggestionClick(suggestion)}
            >
              <div className="suggestion-name">{suggestion.name}</div>
              <IonText color="medium" className="suggestion-category">
                {t(`categories.${suggestion.category}`)}
              </IonText>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSuggestions;
