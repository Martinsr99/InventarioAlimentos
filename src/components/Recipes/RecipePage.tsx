import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { RecipeList } from './RecipeList';
import { useProductList } from '../../hooks/useProductList';
import { useRecipes } from '../../hooks/useRecipes';
import './RecipePage.css';

export const RecipePage: React.FC = () => {
  const { t } = useTranslation();
  const { products, loadProducts } = useProductList();
  const { loading, error } = useRecipes();
  const [selectedSegment, setSelectedSegment] = useState<'suggestions' | 'saved'>('suggestions');

  const expiringProducts = products.filter(product => {
    if (!product.expiryDate) return false;
    const expirationDate = new Date(product.expiryDate);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  });

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await loadProducts();
    } finally {
      event.detail.complete();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>{t('recipes.title')}</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={selectedSegment} onIonChange={e => setSelectedSegment(e.detail.value as any)}>
            <IonSegmentButton value="suggestions">
              <IonLabel>{t('recipes.suggestions')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="saved">
              <IonLabel>{t('recipes.saved')}</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        
        {selectedSegment === 'suggestions' && (
          <>
            {expiringProducts.length > 0 && (
              <div className="expiring-products-notice">
                {t('recipes.expiringProductsNotice', { count: expiringProducts.length })}
              </div>
            )}
            {loading ? (
              <div className="loading-container">
                <IonSpinner />
                <IonText>{t('common.loading')}</IonText>
              </div>
            ) : error ? (
              <div className="error-container">
                <IonText color="danger">{error}</IonText>
              </div>
            ) : (
              <RecipeList products={expiringProducts} />
            )}
          </>
        )}
        
        {selectedSegment === 'saved' && (
          <div className="coming-soon">
            {t('common.comingSoon')}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};
