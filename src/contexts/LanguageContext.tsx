import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getUserSettings, updateUserSettings } from '../services/UserSettingsService';
import { translations, Language, TranslationDictionary } from '../i18n';

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

// Function to interpolate parameters in translation strings
const interpolateParams = (text: string, params?: Record<string, any>): string => {
  if (!params) return text;
  return Object.entries(params).reduce((result, [key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    return result.replace(regex, String(value));
  }, text);
};

// Function to get nested value from an object using dot notation
const getNestedValue = (obj: any, path: string): string | undefined => {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined) return undefined;
    current = current[part];
  }
  return current as string;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsLoadingSettings(true);

      if (user) {
        try {
          const settings = await getUserSettings(user);
          if (settings.language) {
            setLanguage(settings.language);
            localStorage.setItem('language', settings.language);
            auth.languageCode = settings.language;
          }
        } catch (error) {
          console.error('Error loading user language settings:', error);
          const browserLang = getBrowserLanguage();
          setLanguage(browserLang);
          localStorage.setItem('language', browserLang);
          auth.languageCode = browserLang;
        }
      } else {
        const initialLang = getInitialLanguage();
        setLanguage(initialLang);
        localStorage.setItem('language', initialLang);
        auth.languageCode = initialLang;
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
    
    if (currentUser) {
      try {
        await updateUserSettings(currentUser, { language: newLanguage });
      } catch (error) {
        console.error('Error updating language setting:', error);
      }
    }
  };

  const t = (key: string, params?: Record<string, any>): string => {
    console.log('Translation key:', key);
    console.log('Current language:', language);
    
    const currentTranslations = translations[language];
    const translation = getNestedValue(currentTranslations, key);
    
    if (!translation) {
      console.warn(`Missing translation for key: ${key} in language: ${language}`);
      return key;
    }
    
    return params ? interpolateParams(translation, params) : translation;
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
