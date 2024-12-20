import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getUserSettings, updateUserSettings } from '../services/UserSettingsService';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Get browser language
const getBrowserLanguage = (): Language => {
  const fullLang = navigator.language;
  if (fullLang.startsWith('es')) {
    return 'es';
  }
  const languages = navigator.languages || [navigator.language];
  for (const lang of languages) {
    if (lang.startsWith('es')) {
      return 'es';
    }
  }
  return 'en';
};

// Get stored language from localStorage or use browser language
const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem('language');
  if (stored === 'es' || stored === 'en') {
    return stored;
  }
  const browserLang = getBrowserLanguage();
  localStorage.setItem('language', browserLang);
  return browserLang;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsLoadingSettings(true);

      if (user) {
        try {
          const settings = await getUserSettings(user);
          if (settings.language) {
            const newLang = settings.language as Language;
            setLanguage(newLang);
            localStorage.setItem('language', newLang);
            auth.languageCode = newLang;
            i18n.changeLanguage(newLang);
          }
        } catch (error) {
          console.error('Error loading user language settings:', error);
          const browserLang = getBrowserLanguage();
          setLanguage(browserLang);
          localStorage.setItem('language', browserLang);
          auth.languageCode = browserLang;
          i18n.changeLanguage(browserLang);
        }
      } else {
        const initialLang = getInitialLanguage();
        setLanguage(initialLang);
        localStorage.setItem('language', initialLang);
        auth.languageCode = initialLang;
        i18n.changeLanguage(initialLang);
      }

      setIsLoadingSettings(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLanguageChange = async (newLanguage: Language) => {
    if (isLoadingSettings) return;

    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    auth.languageCode = newLanguage;
    i18n.changeLanguage(newLanguage);
    
    if (currentUser) {
      try {
        await updateUserSettings(currentUser, { language: newLanguage });
      } catch (error) {
        console.error('Error updating language setting:', error);
      }
    }
  };

  if (isLoadingSettings) {
    return null;
  }

  return (
    <LanguageContext.Provider 
      value={{ 
        language, 
        setLanguage: handleLanguageChange, 
        t 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
