import React from 'react';
import './AutoDeleteSection.css';
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
import { useProductList } from '../../hooks/useProductList';
import { auth } from '../../firebaseConfig';

const AutoDeleteSection: React.FC = () => {
  const { t } = useLanguage();
  const { settings, updateSettings } = useUserSettings(auth.currentUser);
  const { loadProducts } = useProductList();

  const handleAutoDeleteChange = async (checked: boolean) => {
    if (!auth.currentUser) return;

    try {
      // First update the setting
      await updateSettings({
        autoDeleteExpired: checked
      });
      
      // Always refresh the product list to ensure UI is in sync
      await loadProducts();
    } catch (error) {
      console.error('Error updating auto-delete setting:', error);
    }
  };

  return (
    <div className="auto-delete-section">
      <h2 className="settings-section-title">
        <IonIcon icon={trashBin} className="title-icon" />
        {t('products.deleteExpired')}
      </h2>
      <IonItem lines="none" className="auto-delete-item">
        <IonLabel>
          <IonNote className="description-note">
            {t('settings.autoDeleteExpiredDescription')}
          </IonNote>
        </IonLabel>
        <IonToggle
          className="auto-delete-switch"
          checked={settings.autoDeleteExpired}
          onIonChange={e => handleAutoDeleteChange(e.detail.checked)}
          slot="end"
        />
      </IonItem>
    </div>
  );
};

export default AutoDeleteSection;
