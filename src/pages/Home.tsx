import React, { useState, useCallback } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail
} from '@ionic/react';
import { settingsOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import AddProductForm from '../forms/AddProductForm';
import ProductList from '../components/Products/ProductList';
import UserSettings from '../components/UserSettings/UserSettings';
import { useProductList } from '../hooks/useProductList';
import './Home.css';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const { loadProducts } = useProductList();
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      await loadProducts();
      event.detail.complete();
    } catch (error) {
      console.error('Error refreshing:', error);
      event.detail.complete();
    }
  };

  const handleProductAdded = useCallback(async () => {
    try {
      await loadProducts();
      // Forzar la actualización del ProductList
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error updating products:', error);
    }
  }, [loadProducts]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('app.title')}</IonTitle>
          <IonButtons slot="end">
            <UserSettings />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        <div style={{ paddingTop: '1rem' }}>
          <AddProductForm onProductAdded={handleProductAdded} />
          <ProductList 
            key={updateTrigger}
            onRefreshNeeded={loadProducts}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
