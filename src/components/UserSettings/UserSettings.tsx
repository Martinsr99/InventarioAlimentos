import React, { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonButton,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonList
} from '@ionic/react';
import { settingsOutline, languageOutline, closeOutline } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { auth } from '../../firebaseConfig';

const UserSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const user = auth.currentUser;

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <>
      <IonButton fill="clear" onClick={() => setIsOpen(true)}>
        <IonIcon icon={settingsOutline} />
      </IonButton>

      <IonModal isOpen={isOpen} onDidDismiss={() => setIsOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('common.settings')}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setIsOpen(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent>
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>{t('auth.email')}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem lines="none">
                <IonLabel>
                  <p>{user?.email}</p>
                </IonLabel>
              </IonItem>
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonCardHeader>
              <IonCardTitle>{t('common.settings')}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonIcon icon={languageOutline} slot="start" />
                  <IonLabel>{t('common.language')}</IonLabel>
                  <IonToggle
                    checked={language === 'es'}
                    onIonChange={toggleLanguage}
                    enableOnOffLabels={true}
                    labelPlacement="start"
                  >
                    <div slot="checked">ES</div>
                    <div slot="unchecked">EN</div>
                  </IonToggle>
                </IonItem>
              </IonList>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonModal>
    </>
  );
};

export default UserSettings;
