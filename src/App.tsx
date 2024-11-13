import React, { useEffect, useState } from 'react';
import { 
  IonApp, 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonTitle,
  IonPage,
  setupIonicReact,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonButtons,
  IonSpinner,
  IonToast
} from '@ionic/react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Auth from './components/Authenticator/Auth';
import AddProductForm from './forms/AddProductForm';
import ProductList from './components/Products/ProductList';
import { scheduleExpiryNotifications } from './services/NotificationService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LanguageSwitch from './components/common/LanguageSwitch';

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

/* Theme variables */
import './theme/variables.css';

setupIonicReact({
  mode: 'ios'
});

const AppContent: React.FC = () => {
  const { t } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      setError(t('errors.signOut'));
    }
  };

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

  return (
    <IonApp>
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('app.title')}</IonTitle>
            <IonButtons slot="end" className="ion-padding-end">
              <LanguageSwitch />
              {isAuthenticated && (
                <IonButton 
                  fill="clear"
                  onClick={handleLogout}
                  className="logout-button"
                >
                  {t('app.logout')}
                </IonButton>
              )}
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonGrid>
            <IonRow>
              <IonCol>
                {!isAuthenticated && <Auth />}
                {isAuthenticated && (
                  <>
                    <AddProductForm />
                    <ProductList />
                  </>
                )}
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonContent>

        <IonToast
          isOpen={!!error}
          message={error}
          duration={3000}
          onDidDismiss={() => setError('')}
          position="bottom"
          color="danger"
        />

        <style>{`
          .logout-button {
            margin-left: 8px;
          }
          
          @media (max-width: 576px) {
            ion-title {
              font-size: 1.1rem;
            }
            
            .logout-button {
              font-size: 0.9rem;
            }
          }
        `}</style>
      </IonPage>
    </IonApp>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;
