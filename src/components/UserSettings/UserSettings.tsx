import React, { useState, useEffect } from 'react';
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
  IonList,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonSpinner,
  IonToast
} from '@ionic/react';
import { settingsOutline, languageOutline, closeOutline } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { auth } from '../../firebaseConfig';
import { getUserSettings, updateUserSettings } from '../../services/UserSettingsService';
import './UserSettings.css';

const profilePictures = [
  '/images/profile/apple.png',
  '/images/profile/carrot.png',
  '/images/profile/chocolate_croissant.png',
  '/images/profile/pizza_slice.png',
  '/images/profile/taco.png'
];

const UserSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState('/images/profile/apple.png');
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const user = auth.currentUser;

  useEffect(() => {
    const loadUserSettings = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const settings = await getUserSettings(user);
          if (settings.profilePicture) {
            setProfilePicture(settings.profilePicture);
          }
        } catch (error) {
          console.error('Error loading settings:', error);
          setShowError(true);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadUserSettings();
  }, [user]);

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const handleProfilePictureChange = async (newPicture: string) => {
    if (user) {
      try {
        setIsLoading(true);
        await updateUserSettings(user, { profilePicture: newPicture });
        setProfilePicture(newPicture);
      } catch (error) {
        console.error('Error updating profile picture:', error);
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    }
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
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <IonSpinner />
            </div>
          ) : (
            <>
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>{t('profile.picture')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ 
                      width: '100px',
                      height: '100px',
                      margin: '0 auto',
                      borderRadius: '50%',
                      border: '2px solid var(--ion-color-primary)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <IonImg 
                        src={profilePicture} 
                        alt="Profile"
                        style={{ 
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }} 
                      />
                    </div>
                  </div>
                  <IonGrid>
                    <IonRow>
                      {profilePictures.map((pic) => (
                        <IonCol size="4" key={pic}>
                          <div 
                            onClick={() => handleProfilePictureChange(pic)}
                            className={`profile-picture-option ${profilePicture === pic ? 'selected' : ''}`}
                          >
                            <IonImg 
                              src={pic} 
                              alt="Profile option"
                              style={{ 
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </div>
                        </IonCol>
                      ))}
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>

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
            </>
          )}
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showError}
        onDidDismiss={() => setShowError(false)}
        message={t('errors.settingsLoad')}
        duration={3000}
        color="danger"
      />
    </>
  );
};

export default UserSettings;
