import React from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
} from '@ionic/react';
import { PredefinedProduct } from '../../../services/PredefinedProductsService';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ProductSuggestionsProps {
  name: string;
  showSuggestions: boolean;
  suggestions: PredefinedProduct[];
  onNameChange: (value: string) => void;
  onSuggestionClick: (suggestion: PredefinedProduct) => void;
  onInputBlur: () => void;
  onInputFocus: () => void;
}

const ProductSuggestions: React.FC<ProductSuggestionsProps> = ({
  name,
  showSuggestions,
  suggestions,
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
      </IonItem>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => onSuggestionClick(suggestion)}
            >
              {suggestion.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSuggestions;
