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
import AutoDeleteSection from './AutoDeleteSection';
import DeleteAccountSection from './DeleteAccountSection';
import './UserSettings.css';

interface UserSettingsProps {
  openToShare?: boolean;
  onClose?: () => void;
}

const DEFAULT_PROFILE_PICTURE = '/images/profile/apple.png';

const UserSettings: React.FC<UserSettingsProps> = ({ openToShare = false, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isHeaderElevated, setIsHeaderElevated] = useState(false);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const { t } = useLanguage();
  const user = auth.currentUser;
  const sharingCardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLIonContentElement>(null);

  const {
    settings,
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

  const handleScroll = (e: CustomEvent) => {
    const scrollTop = (e.detail as any).scrollTop;
    const isScrollingDown = scrollTop > lastScrollTop;
    
    if (isScrollingDown && scrollTop > 20) {
      setIsHeaderHidden(true);
    } else if (!isScrollingDown) {
      setIsHeaderHidden(false);
    }

    setIsHeaderElevated(scrollTop > 0);
    setLastScrollTop(scrollTop);
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
          <IonToolbar className={`app-header ${isHeaderElevated ? 'header-elevation' : ''} ${isHeaderHidden ? 'header-hidden' : ''}`}>
            <IonButtons slot="start">
              <IonButton onClick={handleClose} className="back-button">
                <IonIcon icon={chevronBackOutline} />
              </IonButton>
            </IonButtons>
            <IonTitle>{t('common.settings')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonContent 
          ref={contentRef}
          scrollEvents={true}
          onIonScroll={handleScroll}
        >
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <IonSpinner />
            </div>
          ) : (
            <div style={{ paddingTop: '40px' }}>
              <ProfileSection
                profilePicture={settings.profilePicture || DEFAULT_PROFILE_PICTURE}
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

              <AutoDeleteSection />

              <LogoutSection onLogout={handleLogout} />

              <DeleteAccountSection />
            </div>
          )}
        </IonContent>
      </IonModal>

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
        color={error === t('sharing.inviteSent') || error === t('sharing.deleteSuccess') ? 'success' : 'danger'}
      />
    </>
  );
};

export default UserSettings;
