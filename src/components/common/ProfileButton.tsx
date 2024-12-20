import React, { useState, useEffect } from 'react';
import { IonBadge, IonButton, IonIcon } from '@ionic/react';
import { useSharing } from '../../hooks/useSharing';
import { useUserSettings } from '../../hooks/useUserSettings';
import { auth } from '../../firebaseConfig';
import UserSettings from '../UserSettings/UserSettings';
import './ProfileButton.css';

const DEFAULT_PROFILE_PICTURE = '/images/profile/apple.png';

const ProfileButton: React.FC = () => {
  const user = auth.currentUser;
  const { settings } = useUserSettings(user);
  const { receivedInvitations, loadSharingData } = useSharing(user, (key: string) => key);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadSharingData();
    }
  }, [user, loadSharingData]);

  // Recargar las invitaciones cuando se cierra el modal
  useEffect(() => {
    if (!isSettingsOpen && user) {
      loadSharingData();
    }
  }, [isSettingsOpen, user, loadSharingData]);

  const handleSettingsClose = () => {
    setIsSettingsOpen(false);
    loadSharingData();
  };

  const handleClick = () => {
    setIsSettingsOpen(true);
  };

  const pendingInvitations = receivedInvitations?.filter(inv => inv.status === 'pending') || [];
  const hasPendingInvitations = pendingInvitations.length > 0;


  return (
    <div className="profile-button-container">
      <div className="profile-button-wrapper">
        <IonButton 
          fill="clear" 
          className="profile-button" 
          onClick={handleClick}
        >
          <div className="profile-image-container">
            <img 
              src={settings.profilePicture || DEFAULT_PROFILE_PICTURE} 
              alt="Profile" 
              className="profile-image"
            />
          </div>
        </IonButton>
        {hasPendingInvitations && (
          <IonBadge color="danger" className="notification-badge">
            {pendingInvitations.length}
          </IonBadge>
        )}
      </div>
      <UserSettings
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
      />
    </div>
  );
};

export default ProfileButton;
