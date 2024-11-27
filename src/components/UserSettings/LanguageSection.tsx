import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonIcon,
  IonLabel,
  IonToggle,
  IonList
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
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{t('common.language')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonList>
          <IonItem>
            <IonIcon icon={languageOutline} slot="start" />
            <IonLabel>{language === 'es' ? 'Español' : 'English'}</IonLabel>
            <IonToggle
              checked={language === 'es'}
              onIonChange={onToggleLanguage}
              enableOnOffLabels={true}
              labelPlacement="start"
            >
              <div slot="checked">ES</div>
              <div slot="unchecked">EN</div>
            </IonToggle>
          </IonItem>
        </IonList>
      </IonCardContent>
    </IonCard>
  );
};
