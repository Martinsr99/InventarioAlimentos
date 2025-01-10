import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User } from 'firebase/auth';

export interface UserSettings {
  language: 'en' | 'es';
  profilePicture?: string;
  email: string;
  autoDeleteExpired?: boolean;
}

const DEFAULT_SETTINGS: Omit<UserSettings, 'language' | 'email'> = {
  profilePicture: '/images/profile/apple.png',
  autoDeleteExpired: false
};

// Get browser language
const getBrowserLanguage = (): 'en' | 'es' => {
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

export const getUserSettings = async (user: User): Promise<UserSettings> => {
  try {
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    const settingsDoc = await getDoc(userSettingsRef);
    
    if (!settingsDoc.exists()) {
      // Si no hay configuraciones, crear las iniciales
      const storedLang = localStorage.getItem('language');
      const defaultLanguage = (storedLang === 'es' || storedLang === 'en') 
        ? storedLang 
        : getBrowserLanguage();
      
      const initialSettings: UserSettings = {
        ...DEFAULT_SETTINGS,
        language: defaultLanguage,
        email: user.email || '',
        autoDeleteExpired: false
      };
      
      // Guardar las configuraciones iniciales
      await setDoc(userSettingsRef, initialSettings, { merge: true });
      return initialSettings;
    }
    
    const settings = settingsDoc.data() as UserSettings;
    
    // Si por alguna razón no hay idioma en las configuraciones, usar el almacenado o el del navegador
    if (!settings.language) {
      const storedLang = localStorage.getItem('language');
      settings.language = (storedLang === 'es' || storedLang === 'en') 
        ? storedLang 
        : getBrowserLanguage();
      
      // Actualizar las configuraciones con el idioma
      await setDoc(userSettingsRef, settings);
    }

    // Asegurarse de que el email esté presente
    if (!settings.email && user.email) {
      settings.email = user.email;
      await setDoc(userSettingsRef, settings);
    }

    // Asegurarse de que autoDeleteExpired tenga un valor por defecto
    if (settings.autoDeleteExpired === undefined) {
      settings.autoDeleteExpired = DEFAULT_SETTINGS.autoDeleteExpired;
      await setDoc(userSettingsRef, settings);
    }
    
    return settings;
  } catch (error) {
    console.error('Error getting user settings:', error);
    // En caso de error, usar el idioma almacenado o el del navegador
    const storedLang = localStorage.getItem('language');
    const defaultLanguage = (storedLang === 'es' || storedLang === 'en') 
      ? storedLang 
      : getBrowserLanguage();
    
    return {
      ...DEFAULT_SETTINGS,
      language: defaultLanguage,
      email: user.email || ''
    };
  }
};

export const updateUserSettings = async (
  user: User,
  settings: Partial<UserSettings>
): Promise<void> => {
  try {
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    const settingsDoc = await getDoc(userSettingsRef);
    
    if (!settingsDoc.exists()) {
      // Si no existen configuraciones, asegurarse de que haya un idioma
      if (!settings.language) {
        const storedLang = localStorage.getItem('language');
        settings.language = (storedLang === 'es' || storedLang === 'en') 
          ? storedLang 
          : getBrowserLanguage();
      }
      
      await setDoc(userSettingsRef, {
        ...DEFAULT_SETTINGS,
        email: user.email || '',
        ...settings
      });
    } else {
      // Si existen configuraciones, mantener el idioma existente si no se proporciona uno nuevo
      const currentSettings = settingsDoc.data() as UserSettings;
      await setDoc(userSettingsRef, {
        ...currentSettings,
        ...settings
      });
    }
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};
