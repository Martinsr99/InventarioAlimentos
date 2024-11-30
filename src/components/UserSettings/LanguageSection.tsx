import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonIcon,
  IonLabel,
  IonToggle
} from '@ionic/react';
import { languageOutline } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageSectionProps {
  onToggleLanguage: () => void;
}

export const LanguageSection: React.FC<LanguageSectionProps> = ({
  onToggleLanguage
}) => {
  const { language, t } = useLanguage();

  return (
    <IonCard className="settings-section">
      <IonCardHeader>
        <IonCardTitle className="settings-section-title">{t('common.language')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="language-toggle">
          <IonItem lines="none" className="language-item">
            <IonIcon icon={languageOutline} slot="start" className="language-icon" />
            <IonLabel>
              <h2 className="language-label">{language === 'es' ? 'Español' : 'English'}</h2>
            </IonLabel>
            <IonToggle
              checked={language === 'es'}
              onIonChange={onToggleLanguage}
              enableOnOffLabels={true}
              labelPlacement="start"
              className="language-switch"
            >
              <div slot="checked" className="toggle-label">ES</div>
              <div slot="unchecked" className="toggle-label">EN</div>
            </IonToggle>
          </IonItem>
        </div>
      </IonCardContent>
    </IonCard>
  );
};