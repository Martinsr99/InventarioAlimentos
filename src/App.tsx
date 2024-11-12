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
  IonToast,
  IonSpinner
} from '@ionic/react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import Auth from './components/Authenticator/Auth';
import AddProductForm from './forms/AddProductForm';
import ProductList from './components/Products/ProductList';
import { scheduleExpiryNotifications } from './services/NotificationService';

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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastIsError, setToastIsError] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, 
      async (user: User | null) => {
        setIsAuthenticated(!!user);
        if (user) {
          try {
            await scheduleExpiryNotifications();
          } catch (error) {
            console.error('Error scheduling notifications:', error);
            showToast('Notificaciones pueden no funcionar correctamente', true);
          }
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        showToast('Error al verificar el estado de autenticación', true);
        setIsLoading(false);
      }
    );

    return () => {
      try {
        unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing from auth state:', error);
      }
    };
  }, []);

  const showToast = (message: string, isError: boolean = false) => {
    setToastMessage(message);
    setToastIsError(isError);
  };

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await signOut(auth);
      showToast('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error signing out:', error);
      showToast('Error al cerrar sesión. Por favor intente nuevamente.', true);
    } finally {
      setIsSigningOut(false);
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
            <IonTitle>Inventario de Alimentos</IonTitle>
            {isAuthenticated && (
              <IonButton 
                slot="end" 
                fill="clear"
                onClick={handleLogout}
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <IonSpinner name="crescent" />
                ) : (
                  'Cerrar Sesión'
                )}
              </IonButton>
            )}
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
          isOpen={!!toastMessage}
          onDidDismiss={() => setToastMessage('')}
          message={toastMessage}
          duration={3000}
          position="bottom"
          color={toastIsError ? 'danger' : 'success'}
        />
      </IonPage>
    </IonApp>
  );
};

export default App;
