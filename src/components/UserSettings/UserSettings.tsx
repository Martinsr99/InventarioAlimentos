import React, { useRef } from 'react';
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
import { chevronBackOutline } from 'ionicons/icons';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUserSettings } from '../../hooks/useUserSettings';
import { useSharing } from '../../hooks/useSharing';
import { ProfileSection } from './ProfileSection';
import { UserInfoSection } from './UserInfoSection';
import { SharingSection } from './SharingSection';
import { LogoutSection } from './LogoutSection';
import AutoDeleteSection from './AutoDeleteSection';
import DeleteAccountSection from './DeleteAccountSection';
import './UserSettings.css';

interface UserSettingsProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const DEFAULT_PROFILE_PICTURE = '/images/profile/apple.png';

const UserSettings: React.FC<UserSettingsProps> = ({ isOpen = false, onClose }) => {
  const { t } = useLanguage();
  const user = auth.currentUser;
  const sharingCardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);

  const {
    settings,
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
    friendToDelete,
    sortBy,
    sortDirection,
    handleEmailChange,
    handleSendInvite,
    handleInvitationResponse,
    handleDeleteInvitation,
    handleDeleteFriend,
    confirmDeleteInvitation,
    confirmDeleteFriend,
    setShowDeleteConfirm,
    setInvitationToDelete,
    setFriendToDelete,
    setError: setSharingError,
    setSortBy,
    toggleSortDirection
  } = useSharing(user, t);

  const isLoading = settingsLoading || sharingLoading;
  const error = settingsError || sharingError;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose?.();
    } catch (error) {
      console.error('Error signing out:', error);
      setSharingError(t('errors.signOut'));
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar className="app-header">
          <IonButtons slot="start">
            <IonButton onClick={onClose} className="back-button">
              <IonIcon icon={chevronBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{t('common.settings')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent 
        ref={contentRef}
        scrollEvents={true}
      >
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <IonSpinner />
          </div>
        ) : (
          <div className="settings-container">
            <div className="settings-card">
              <ProfileSection
                profilePicture={settings.profilePicture || DEFAULT_PROFILE_PICTURE}
                onProfilePictureChange={handleProfilePictureChange}
              />

              <div className="settings-divider"></div>

              <UserInfoSection 
                email={user?.email}
                onToggleLanguage={toggleLanguage}
              />

              <div className="settings-divider"></div>

              <div ref={sharingCardRef}>
                <SharingSection
                  inviteEmail={inviteEmail}
                  isEmailValid={isEmailValid}
                  receivedInvitations={receivedInvitations}
                  sentInvitations={sentInvitations}
                  friends={friends}
                  sortBy={sortBy}
                  sortDirection={sortDirection}
                  onEmailChange={handleEmailChange}
                  onSendInvite={handleSendInvite}
                  onInvitationResponse={handleInvitationResponse}
                  onDeleteInvite={confirmDeleteInvitation}
                  onDeleteFriend={confirmDeleteFriend}
                  onSortByChange={setSortBy}
                  onSortDirectionChange={toggleSortDirection}
                />
              </div>

              <div className="settings-divider"></div>

              <LogoutSection onLogout={handleLogout} />

              <div className="settings-divider"></div>

              <DeleteAccountSection />
            </div>
          </div>
        )}
      </IonContent>

      <IonAlert
        isOpen={showDeleteConfirm}
        onDidDismiss={() => {
          setShowDeleteConfirm(false);
          setInvitationToDelete('');
          setFriendToDelete('');
        }}
        header={friendToDelete ? t('sharing.deleteConfirm') : t('sharing.deleteConfirm')}
        message={friendToDelete ? t('sharing.deleteConfirmMessage') : t('sharing.deleteConfirmMessage')}
        buttons={[
          {
            text: t('common.cancel'),
            role: 'cancel',
            handler: () => {
              setShowDeleteConfirm(false);
              setInvitationToDelete('');
              setFriendToDelete('');
            }
          },
          {
            text: t('common.delete'),
            role: 'destructive',
            handler: () => {
              if (friendToDelete) {
                handleDeleteFriend();
              } else {
                handleDeleteInvitation();
              }
            }
          }
        ]}
      />

      <IonToast
        isOpen={!!error}
        onDidDismiss={() => setSharingError(null)}
        message={error || ''}
        duration={3000}
        color={error === t('sharing.inviteSent') || 
               error === t('sharing.deleteSuccess') || 
               error === t('sharing.inviteAccepted') || 
               error === t('sharing.inviteRejected') ? 'success' : 'danger'}
      />
    </IonModal>
  );
};

export default UserSettings;
