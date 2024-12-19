import React, { useEffect, useState } from 'react';
import { 
  IonApp, 
  IonContent, 
  IonPage,
  setupIonicReact,
  IonSpinner,
  IonToast,
  IonRouterOutlet,
  IonAlert
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './components/Authenticator/Auth';
import { scheduleExpiryNotifications } from './services/NotificationService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import Home from './pages/Home';
import EditProduct from './components/Products/EditProduct/EditProduct';

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
  const [showNotificationAlert, setShowNotificationAlert] = useState(false);

  useEffect(() => {
    auth.languageCode = language;
  }, [language]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        try {
          await scheduleExpiryNotifications();
        } catch (error: any) {
          if (Capacitor.isNativePlatform()) {
            console.error('Error scheduling notifications:', error);
            if (error.message === 'Notification permissions not granted') {
              setShowNotificationAlert(true);
            } else {
              setError(t('errors.notificationSetup'));
            }
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [t]);

  if (isLoading) {
    return (
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
    );
  }

  return (
    <>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route path="/auth" exact>
            {isAuthenticated ? <Redirect to="/home" /> : <Auth />}
          </Route>
          <Route path="/home" exact>
            {isAuthenticated ? <Home /> : <Redirect to="/auth" />}
          </Route>
          <Route path="/edit-product/:id" exact>
            {isAuthenticated ? (
              <EditProduct 
                productId={window.location.pathname.split('/').pop() || ''} 
                onSaved={() => {}} 
              />
            ) : (
              <Redirect to="/auth" />
            )}
          </Route>
          <Route exact path="/">
            <Redirect to={isAuthenticated ? "/home" : "/auth"} />
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>

      <IonToast
        isOpen={!!error}
        message={error}
        duration={3000}
        onDidDismiss={() => setError('')}
        position="bottom"
        color="danger"
      />

      <IonAlert
        isOpen={showNotificationAlert}
        onDidDismiss={() => setShowNotificationAlert(false)}
        header={t('notifications.permissionRequired')}
        message={t('notifications.enableInSettings')}
        buttons={[
          {
            text: t('common.ok'),
            role: 'cancel'
          }
        ]}
      />
    </>
  );
};

const App: React.FC = () => {
  return (
    <IonApp className="dark-theme">
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </IonApp>
  );
};

export default App;
