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
  IonToast,
  IonInput,
  IonText,
  IonBadge,
  IonAvatar
} from '@ionic/react';
import { settingsOutline, languageOutline, chevronBackOutline, logOutOutline, personAddOutline, mailOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { getUserSettings, updateUserSettings } from '../../services/UserSettingsService';
import { sendShareInvitation, getReceivedInvitations, getSentInvitations, respondToInvitation, ShareInvitation } from '../../services/SharedProductsService';
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
  const [errorMessage, setErrorMessage] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [receivedInvitations, setReceivedInvitations] = useState<ShareInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<ShareInvitation[]>([]);
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
          
          // Load invitations
          const received = await getReceivedInvitations(user);
          const sent = await getSentInvitations(user);
          setReceivedInvitations(received);
          setSentInvitations(sent);
        } catch (error) {
          console.error('Error loading settings:', error);
          setErrorMessage(t('errors.settingsLoad'));
          setShowError(true);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadUserSettings();
  }, [user, t]);

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
        setErrorMessage(t('errors.settingsSave'));
        setShowError(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendInvite = async () => {
    if (!user || !inviteEmail.trim()) return;

    try {
      setIsLoading(true);
      await sendShareInvitation(user, inviteEmail);
      const sent = await getSentInvitations(user);
      setSentInvitations(sent);
      setInviteEmail('');
      setErrorMessage(t('sharing.inviteSent'));
      setShowError(true);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setErrorMessage(error.message === 'Invitation already sent to this user' 
        ? t('sharing.alreadyInvited') 
        : t('errors.invitationSend'));
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, response: 'accepted' | 'rejected') => {
    if (!user) return;

    try {
      setIsLoading(true);
      await respondToInvitation(user, invitationId, response);
      const received = await getReceivedInvitations(user);
      setReceivedInvitations(received);
    } catch (error) {
      console.error('Error responding to invitation:', error);
      setErrorMessage(t('errors.invitationResponse'));
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleClose();
    } catch (error) {
      console.error('Error signing out:', error);
      setErrorMessage(t('errors.signOut'));
      setShowError(true);
    }
  };

  return (
    <>
      <IonButton 
        fill="clear" 
        onClick={() => setIsOpen(true)}
        className="settings-button"
      >
        <IonIcon icon={settingsOutline} />
      </IonButton>

      <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
        <IonHeader>
          <IonToolbar className="app-header">
            <IonButtons slot="start">
              <IonButton 
                onClick={handleClose}
                className="back-button"
              >
                <IonIcon icon={chevronBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>{t('common.settings')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonContent>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <IonSpinner />
            </div>
          ) : (
            <>
              <IonCard className="profile-card">
                <IonCardHeader>
                  <IonCardTitle>{t('profile.picture')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ 
                      width: '100px',
                      height: '100px',
                      margin: '0 auto 2rem',
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
                    <IonIcon icon={mailOutline} slot="start" />
                    <IonLabel>
                      <p>{user?.email}</p>
                    </IonLabel>
                  </IonItem>
                </IonCardContent>
              </IonCard>

              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>{t('common.language')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>
                      <IonIcon icon={languageOutline} slot="start" />
                      <IonLabel>{language === 'es' ? 'Español' : 'English'}</IonLabel>
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

              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>{t('sharing.title')}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonItem lines="none" className="invite-input-container">
                    <IonIcon icon={mailOutline} slot="start" />
                    <IonInput
                      type="email"
                      value={inviteEmail}
                      onIonChange={e => setInviteEmail(e.detail.value || '')}
                      placeholder={t('sharing.enterEmail')}
                    />
                    <IonButton 
                      slot="end" 
                      onClick={handleSendInvite}
                      disabled={!inviteEmail.trim()}
                    >
                      <IonIcon icon={personAddOutline} slot="start" />
                      {t('sharing.sendInvite')}
                    </IonButton>
                  </IonItem>

                  {receivedInvitations.length > 0 && (
                    <>
                      <h2>{t('sharing.receivedInvites')}</h2>
                      <IonList>
                        {receivedInvitations.map(invitation => (
                          <IonItem key={invitation.id}>
                            <IonAvatar slot="start">
                              <IonImg src="/images/profile/apple.png" alt="User" />
                            </IonAvatar>
                            <IonLabel>
                              <h2>{invitation.fromUserEmail}</h2>
                              <p>{t('sharing.invitePending')}</p>
                            </IonLabel>
                            <IonButton
                              slot="end"
                              color="success"
                              onClick={() => handleInvitationResponse(invitation.id, 'accepted')}
                            >
                              <IonIcon icon={checkmarkCircleOutline} slot="start" />
                              {t('sharing.accept')}
                            </IonButton>
                            <IonButton
                              slot="end"
                              color="danger"
                              onClick={() => handleInvitationResponse(invitation.id, 'rejected')}
                            >
                              <IonIcon icon={closeCircleOutline} slot="start" />
                              {t('sharing.reject')}
                            </IonButton>
                          </IonItem>
                        ))}
                      </IonList>
                    </>
                  )}

                  {sentInvitations.length > 0 && (
                    <>
                      <h2>{t('sharing.sentInvites')}</h2>
                      <IonList>
                        {sentInvitations.map(invitation => (
                          <IonItem key={invitation.id}>
                            <IonAvatar slot="start">
                              <IonImg src="/images/profile/apple.png" alt="User" />
                            </IonAvatar>
                            <IonLabel>
                              <h2>{invitation.toUserEmail}</h2>
                              <IonBadge color={
                                invitation.status === 'accepted' ? 'success' :
                                invitation.status === 'rejected' ? 'danger' : 'warning'
                              }>
                                {t(`sharing.invite${invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}`)}
                              </IonBadge>
                            </IonLabel>
                          </IonItem>
                        ))}
                      </IonList>
                    </>
                  )}

                  {receivedInvitations.length === 0 && sentInvitations.length === 0 && (
                    <IonText color="medium">
                      <p>{t('sharing.noInvites')}</p>
                    </IonText>
                  )}
                </IonCardContent>
              </IonCard>

              <div className="logout-container">
                <IonButton 
                  expand="block"
                  color="danger"
                  onClick={handleLogout}
                  className="logout-button-settings"
                >
                  <IonIcon icon={logOutOutline} slot="start" />
                  {t('app.logout')}
                </IonButton>
              </div>
            </>
          )}
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showError}
        onDidDismiss={() => setShowError(false)}
        message={errorMessage}
        duration={3000}
        color={errorMessage === t('sharing.inviteSent') ? 'success' : 'danger'}
      />
    </>
  );
};

export default UserSettings;
