import React from 'react';
import {
  IonItem,
  IonIcon,
  IonLabel
} from '@ionic/react';
import { mailOutline } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface EmailSectionProps {
  email: string | null | undefined;
}

export const EmailSection: React.FC<EmailSectionProps> = ({ email }) => {
  const { t } = useLanguage();

  return (
    <div className="email-section">
      <h2 className="settings-section-title">{t('auth.email')}</h2>
      <IonItem lines="none">
        <IonIcon icon={mailOutline} slot="start" />
        <IonLabel>
          <p>{email}</p>
        </IonLabel>
      </IonItem>
    </div>
  );
};
