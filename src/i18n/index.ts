import en from './en';
import es from './es';

// Define the structure of our translations
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
