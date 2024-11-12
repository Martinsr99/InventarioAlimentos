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
  IonCol
} from '@ionic/react';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        scheduleExpiryNotifications();
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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
              >
                Cerrar Sesión
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
      </IonPage>
    </IonApp>
  );
};

export default App;
