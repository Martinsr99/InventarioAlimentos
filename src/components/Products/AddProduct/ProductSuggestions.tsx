import React from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonList,
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
        <IonList className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <IonItem
              key={index}
              button
              onClick={() => onSuggestionClick(suggestion)}
              className="suggestion-item"
            >
              <IonLabel>{suggestion.name}</IonLabel>
            </IonItem>
          ))}
        </IonList>
      )}
    </div>
  );
};

export default ProductSuggestions;
