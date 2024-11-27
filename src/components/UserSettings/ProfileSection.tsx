import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
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
                  onClick={() => onProfilePictureChange(pic)}
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
  );
};
