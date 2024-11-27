import React from 'react';
import {
  IonButton,
  IonIcon
} from '@ionic/react';
import { logOutOutline } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface LogoutSectionProps {
  onLogout: () => Promise<void>;
}

export const LogoutSection: React.FC<LogoutSectionProps> = ({ onLogout }) => {
  const { t } = useLanguage();

  return (
    <div className="logout-container">
      <IonButton 
        expand="block"
        color="danger"
        onClick={onLogout}
        className="logout-button-settings"
      >
        <IonIcon icon={logOutOutline} slot="start" />
        {t('app.logout')}
      </IonButton>
    </div>
  );
};
