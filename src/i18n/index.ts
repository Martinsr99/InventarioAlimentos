import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en';
import es from './es';

export interface TranslationDictionary {
  app: { [key: string]: string };
  auth: { [key: string]: string };
  categories: { [key: string]: string };
  common: { [key: string]: string };
  errors: { [key: string]: string };
  locations: { [key: string]: string };
  notifications: { [key: string]: string };
  products: { [key: string]: string };
  profile: { [key: string]: string };
  settings: { [key: string]: string };
  sharing: { [key: string]: string };
  validation: { [key: string]: string };
}

const translations = {
  en,
  es
} as const;

export type Language = keyof typeof translations;

// Cast translations to the correct type
const typedTranslations: Record<Language, TranslationDictionary> = {
  en: en as unknown as TranslationDictionary,
  es: es as unknown as TranslationDictionary
};

export { typedTranslations as translations };

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es }
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
