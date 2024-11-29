import React, { useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonActionSheet,
} from '@ionic/react';
import { useLanguage } from '../../../contexts/LanguageContext';

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

interface CategorySelectorProps {
  category: string;
  onCategoryChange: (value: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  category,
  onCategoryChange,
}) => {
  const { t } = useLanguage();
  const [showActionSheet, setShowActionSheet] = useState(false);

  return (
    <>
      <IonItem onClick={() => setShowActionSheet(true)} button>
        <IonLabel position="stacked">
          {t('products.category')} ({t('common.optional')})
        </IonLabel>
        <IonLabel>
          {category ? t(`categories.${category}`) : t('products.selectCategory')}
        </IonLabel>
      </IonItem>

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        cssClass="product-action-sheet"
        header={t('products.selectCategory')}
        buttons={[
          ...CATEGORIES.map(cat => ({
            text: t(`categories.${cat}`),
            cssClass: category === cat ? 'selected-user' : '',
            handler: () => {
              onCategoryChange(cat);
            }
          })),
          {
            text: t('common.cancel'),
            role: 'cancel'
          }
        ]}
      />
    </>
  );
};

export default CategorySelector;
