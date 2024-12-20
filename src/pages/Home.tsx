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
import { useTranslation } from 'react-i18next';
import AddProductForm from '../forms/AddProductForm';
import ProductList from '../components/Products/ProductList';
import ProfileButton from '../components/common/ProfileButton';
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
      <IonHeader className="header-hide-on-scroll">
        <IonToolbar>
          <IonTitle>{t('app.title')}</IonTitle>
          <IonButtons slot="end">
            <ProfileButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent 
        fullscreen 
        scrollEvents={true}
        onIonScroll={(e) => {
          const header = document.querySelector('.header-hide-on-scroll');
          if (header) {
            const scrollTop = e.detail.scrollTop;
            const deltaY = e.detail.deltaY;
            
            if (deltaY > 0 && scrollTop > 20) {
              // Scrolling down
              header.classList.add('header-hidden');
            } else if (deltaY < 0) {
              // Scrolling up
              header.classList.remove('header-hidden');
            }
          }
        }}
      >
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        <div className="page-content">
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
