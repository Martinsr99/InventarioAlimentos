import React from 'react';
import {
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonNote,
} from '@ionic/react';
import { trashBin } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUserSettings } from '../../hooks/useUserSettings';
import { auth } from '../../firebaseConfig';

const AutoDeleteSection: React.FC = () => {
  const { t } = useLanguage();
  const { settings, updateSettings } = useUserSettings(auth.currentUser);

  const handleAutoDeleteChange = async (checked: boolean) => {
    if (!auth.currentUser) return;

    try {
      await updateSettings({
        autoDeleteExpired: checked
      });
    } catch (error) {
      console.error('Error updating auto-delete setting:', error);
    }
  };

  return (
    <div className="auto-delete-section">
      <h2 className="settings-section-title">
        {t('products.deleteExpired')}
      </h2>
      <IonItem lines="none">
        <IonIcon icon={trashBin} slot="start" color="danger" />
        <IonLabel>
          {t('settings.autoDeleteExpired')}
          <IonNote className="ion-margin-top">
            {t('settings.autoDeleteExpiredDescription')}
          </IonNote>
        </IonLabel>
        <IonToggle
          checked={settings.autoDeleteExpired}
          onIonChange={e => handleAutoDeleteChange(e.detail.checked)}
        />
      </IonItem>
    </div>
  );
};

export default AutoDeleteSection;
