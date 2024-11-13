import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getUserSettings, updateUserSettings } from '../services/UserSettingsService';
import enTranslations from '../i18n/en.json';
import esTranslations from '../i18n/es.json';

type Language = 'en' | 'es';

interface Translations {
  [key: string]: string;
}

interface TranslationsMap {
  en: Translations;
  es: Translations;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: TranslationsMap = {
  en: enTranslations,
  es: esTranslations
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load user settings when authenticated
        const settings = await getUserSettings(user);
        setLanguage(settings.language);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update user settings when language changes
  const handleLanguageChange = async (newLanguage: Language) => {
    setLanguage(newLanguage);
    if (currentUser) {
      try {
        await updateUserSettings(currentUser, { language: newLanguage });
      } catch (error) {
        console.error('Error updating language setting:', error);
      }
    }
  };

  const t = (key: string): string => {
    const currentTranslations = translations[language];
    return currentTranslations[key] || key;
  };

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
