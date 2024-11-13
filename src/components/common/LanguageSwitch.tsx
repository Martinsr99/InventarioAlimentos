import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { languageOutline } from 'ionicons/icons';
import '../../styles/LanguageSwitch.css';

const LanguageSwitch: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  return (
    <IonButton
      fill="clear"
      onClick={toggleLanguage}
      className="language-switch"
      title={language === 'es' ? "Switch to English" : "Cambiar a español"}
    >
      <div className="language-switch-content">
        <IonIcon 
          icon={languageOutline} 
          className="language-icon"
        />
        <span className="language-text">
          {language === 'es' ? 'ES' : 'EN'}
        </span>
      </div>
    </IonButton>
  );
};

export default LanguageSwitch;
