import React, { useEffect, useState, useCallback } from 'react';
import { 
  IonApp, 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonPage,
  setupIonicReact,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonSpinner,
  IonToast,
  IonRouterOutlet
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Authenticator/Auth';
import AddProductForm from './forms/AddProductForm';
import ProductList from './components/Products/ProductList';
import EditProduct from './components/Products/EditProduct/EditProduct';
import { scheduleExpiryNotifications } from './services/NotificationService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import UserSettings from './components/UserSettings/UserSettings';
import { Capacitor } from '@capacitor/core';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './theme/variables.css';
import './styles/Header.css';

setupIonicReact({
  mode: 'ios'
});

const AppContent: React.FC = () => {
  const { t, language } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isHeaderElevated, setIsHeaderElevated] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [openSettingsToShare, setOpenSettingsToShare] = useState(false);
  const [authKey, setAuthKey] = useState(0);

  useEffect(() => {
    auth.languageCode = language;
  }, [language]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        try {
          await scheduleExpiryNotifications();
          setAuthKey(prev => prev + 1);
        } catch (error) {
          if (Capacitor.isNativePlatform()) {
            console.error('Error scheduling notifications:', error);
            setError(t('errors.notificationSetup'));
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [t]);

  const handleScroll = (e: CustomEvent) => {
    const scrollTop = (e.detail as any).scrollTop;
    const isScrollingDown = scrollTop > lastScrollTop;
    
    if (isScrollingDown && scrollTop > 20) {
      setIsHeaderHidden(true);
    } else if (!isScrollingDown) {
      setIsHeaderHidden(false);
    }

    setIsHeaderElevated(scrollTop > 0);
    setLastScrollTop(scrollTop);
  };

  const handleProductChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleOpenSettingsToShare = () => {
    setOpenSettingsToShare(true);
  };

  const handleSettingsClose = () => {
    setOpenSettingsToShare(false);
  };

  if (isLoading) {
    return (
      <IonApp className="dark-theme">
        <IonPage>
          <IonContent>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%' 
            }}>
              <IonSpinner name="crescent" />
            </div>
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  if (!isAuthenticated) {
    return (
      <IonApp className="dark-theme">
        <IonPage>
          <IonContent>
            <Auth />
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  return (
    <IonApp className="dark-theme">
      <IonRouterOutlet>
        <Route exact path="/">
          <IonPage>
            <IonHeader>
              <IonToolbar className={`app-header ${isHeaderElevated ? 'header-elevation' : ''} ${isHeaderHidden ? 'header-hidden' : ''}`}>
                <IonButtons slot="end" className="header-buttons">
                  <UserSettings 
                    openToShare={openSettingsToShare} 
                    onClose={handleSettingsClose}
                  />
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent 
              scrollY={true}
              scrollEvents={true}
              onIonScroll={handleScroll}
            >
              <div style={{ paddingTop: '40px' }}>
                <AddProductForm onProductAdded={handleProductChange} />
                <ProductList 
                  key={`${authKey}-${refreshKey}`} 
                  onOpenSettingsToShare={handleOpenSettingsToShare}
                />
              </div>
            </IonContent>
          </IonPage>
        </Route>
        <Route 
          exact 
          path="/edit-product/:id" 
          render={({ match }) => (
            <EditProduct 
              productId={match.params.id} 
              onSaved={handleProductChange} 
            />
          )}
        />
        <Route>
          <Redirect to="/" />
        </Route>
      </IonRouterOutlet>

      <IonToast
        isOpen={!!error}
        message={error}
        duration={3000}
        onDidDismiss={() => setError('')}
        position="bottom"
        color="danger"
      />
    </IonApp>
  );
};

const App: React.FC = () => {
  return (
    <IonReactRouter>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </IonReactRouter>
  );
};

export default App;
