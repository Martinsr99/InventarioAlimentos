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
  t: (key: string, params?: Record<string, any>) => string;
}

const translations: TranslationsMap = {
  en: enTranslations,
  es: esTranslations
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Get browser language
const getBrowserLanguage = (): Language => {
  // Primero intentar obtener el idioma completo (e.g., 'es-ES', 'en-US')
  const fullLang = navigator.language;
  
  // Si el idioma completo empieza con 'es', usar español
  if (fullLang.startsWith('es')) {
    return 'es';
  }
  
  // Si no, intentar con los idiomas preferidos del navegador
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

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Listen for auth state changes and load user settings
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
          // Si hay error, usar el idioma del navegador
          const browserLang = getBrowserLanguage();
          setLanguage(browserLang);
          localStorage.setItem('language', browserLang);
          auth.languageCode = browserLang;
        }
      } else {
        // Si no hay usuario, usar el idioma almacenado o el del navegador
        const initialLang = getInitialLanguage();
        setLanguage(initialLang);
        localStorage.setItem('language', initialLang);
        auth.languageCode = initialLang;
      }

      setIsLoadingSettings(false);
    });

    return () => unsubscribe();
  }, []);

  // Update user settings when language changes
  const handleLanguageChange = async (newLanguage: Language) => {
    // Prevent language change while loading settings
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
    const currentTranslations = translations[language];
    const translation = currentTranslations[key] || key;
    return params ? interpolateParams(translation, params) : translation;
  };

  // Show loading state while fetching initial settings
  if (isLoadingSettings) {
    return null; // or a loading spinner
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
