import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
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
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{t('auth.email')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem lines="none">
          <IonIcon icon={mailOutline} slot="start" />
          <IonLabel>
            <p>{email}</p>
          </IonLabel>
        </IonItem>
      </IonCardContent>
    </IonCard>
  );
};
