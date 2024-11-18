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
import EditProduct from './components/Products/EditProduct';
import { scheduleExpiryNotifications } from './services/NotificationService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import UserSettings from './components/UserSettings/UserSettings';

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

  // Set Firebase language based on current language context
  useEffect(() => {
    auth.languageCode = language;
  }, [language]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        try {
          await scheduleExpiryNotifications();
        } catch (error) {
          console.error('Error scheduling notifications:', error);
          setError(t('errors.notificationSetup'));
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [t]);

  const handleScroll = (e: CustomEvent) => {
    const scrollTop = (e.detail as any).scrollTop;
    setIsHeaderElevated(scrollTop > 0);
  };

  const handleProductChange = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  if (isLoading) {
    return (
      <IonApp>
        <IonPage>
          <IonContent className="ion-padding">
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
      <IonApp>
        <IonPage>
          <IonContent>
            <Auth />
          </IonContent>
        </IonPage>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonRouterOutlet>
        <Route exact path="/">
          <IonPage>
            <IonHeader>
              <IonToolbar className={`app-header ${isHeaderElevated ? 'header-elevation' : ''}`}>
                <IonButtons slot="end" className="header-buttons">
                  <UserSettings />
                </IonButtons>
              </IonToolbar>
            </IonHeader>
            <IonContent scrollEvents={true} onIonScroll={handleScroll}>
              <IonGrid>
                <IonRow>
                  <IonCol>
                    <AddProductForm onProductAdded={handleProductChange} />
                    <ProductList key={refreshKey} />
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonContent>
          </IonPage>
        </Route>
        <Route 
          exact 
          path="/edit-product/:id" 
          render={(props) => (
            <EditProduct {...props} onProductUpdated={handleProductChange} />
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
