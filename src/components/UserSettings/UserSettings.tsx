import React, { useState, useRef, useEffect } from 'react';
import {
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
  IonSpinner,
  IonToast,
  IonAlert
} from '@ionic/react';
import { settingsOutline, chevronBackOutline } from 'ionicons/icons';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUserSettings } from '../../hooks/useUserSettings';
import { useSharing } from '../../hooks/useSharing';
import { ProfileSection } from './ProfileSection';
import { EmailSection } from './EmailSection';
import { LanguageSection } from './LanguageSection';
import { SharingSection } from './SharingSection';
import { LogoutSection } from './LogoutSection';
import './UserSettings.css';

interface UserSettingsProps {
  openToShare?: boolean;
  onClose?: () => void;
}

const UserSettings: React.FC<UserSettingsProps> = ({ openToShare = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const user = auth.currentUser;
  const sharingCardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);

  const {
    profilePicture,
    language,
    isLoading: settingsLoading,
    error: settingsError,
    handleProfilePictureChange,
    toggleLanguage
  } = useUserSettings(user);

  const {
    inviteEmail,
    isEmailValid,
    receivedInvitations,
    sentInvitations,
    friends,
    isLoading: sharingLoading,
    error: sharingError,
    showDeleteConfirm,
    invitationToDelete,
    handleEmailChange,
    handleSendInvite,
    handleInvitationResponse,
    handleDeleteInvitation,
    confirmDeleteInvitation,
    setShowDeleteConfirm,
    setInvitationToDelete,
    setError: setSharingError
  } = useSharing(user, t);

  const isLoading = settingsLoading || sharingLoading;
  const error = settingsError || sharingError;

  useEffect(() => {
    if (openToShare) {
      setIsOpen(true);
    }
  }, [openToShare]);

  useEffect(() => {
    if (isOpen && openToShare && !isLoading) {
      setTimeout(() => {
        if (sharingCardRef.current && contentRef.current) {
          contentRef.current.scrollToPoint(0, sharingCardRef.current.offsetTop, 500);
        }
      }, 100);
    }
  }, [isOpen, openToShare, isLoading]);

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleClose();
    } catch (error) {
      console.error('Error signing out:', error);
      setSharingError(t('errors.signOut'));
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
              <IonButton onClick={handleClose} className="back-button">
                <IonIcon icon={chevronBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>{t('common.settings')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonContent ref={contentRef}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <IonSpinner />
            </div>
          ) : (
            <>
              <ProfileSection
                profilePicture={profilePicture}
                onProfilePictureChange={handleProfilePictureChange}
              />

              <EmailSection email={user?.email} />

              <LanguageSection onToggleLanguage={toggleLanguage} />

              <div ref={sharingCardRef}>
                <SharingSection
                  inviteEmail={inviteEmail}
                  isEmailValid={isEmailValid}
                  receivedInvitations={receivedInvitations}
                  sentInvitations={sentInvitations}
                  friends={friends}
                  onEmailChange={handleEmailChange}
                  onSendInvite={handleSendInvite}
                  onInvitationResponse={handleInvitationResponse}
                  onDeleteInvite={confirmDeleteInvitation}
                />
              </div>

              <LogoutSection onLogout={handleLogout} />
            </>
          )}
        </IonContent>
      </IonModal>

      <IonAlert
        isOpen={showDeleteConfirm}
        onDidDismiss={() => {
          setShowDeleteConfirm(false);
          setInvitationToDelete('');
        }}
        header={t('sharing.deleteConfirm')}
        message={t('sharing.deleteConfirmMessage')}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel',
            handler: () => {
              setShowDeleteConfirm(false);
              setInvitationToDelete('');
            }
          },
          {
            text: t('common.delete'),
            role: 'destructive',
            handler: handleDeleteInvitation
          }
        ]}
      />

      <IonToast
        isOpen={!!error}
        onDidDismiss={() => setSharingError(null)}
        message={error || ''}
        duration={3000}
        color={error === t('sharing.inviteSent') || error === t('sharing.deleteSuccess') ? 'success' : 'danger'}
      />
    </>
  );
};

export default UserSettings;
