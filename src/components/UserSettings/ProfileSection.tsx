import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonImg
} from '@ionic/react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProfileSectionProps {
  profilePicture: string;
  onProfilePictureChange: (newPicture: string) => Promise<void>;
}

const profilePictures = [
  '/images/profile/apple.png',
  '/images/profile/carrot.png',
  '/images/profile/chocolate_croissant.png',
  '/images/profile/pizza_slice.png',
  '/images/profile/taco.png'
];

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profilePicture,
  onProfilePictureChange
}) => {
  const { t } = useLanguage();

  return (
    <IonCard className="profile-card">
      <IonCardHeader>
        <IonCardTitle className="settings-section-title">{t('profile.picture')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="current-profile-container">
          <div className="current-profile-picture">
            <IonImg 
              src={profilePicture} 
              alt="Current profile"
              className="profile-image"
            />
          </div>
        </div>
        <div className="profile-pictures-grid">
          {profilePictures.map((pic) => (
            <button 
              key={pic}
              onClick={() => onProfilePictureChange(pic)}
              className={`profile-picture-option ${profilePicture === pic ? 'selected' : ''}`}
              aria-label={`Select profile picture ${pic.split('/').pop()?.split('.')[0]}`}
            >
              <IonImg 
                src={pic} 
                alt="Profile option"
                className="profile-image"
              />
            </button>
          ))}
        </div>
      </IonCardContent>
    </IonCard>
  );
};
