import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User } from 'firebase/auth';

export interface UserSettings {
  language: 'en' | 'es';
  profilePicture?: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en',
  profilePicture: '/images/profile/apple.png'
};

export const getUserSettings = async (user: User): Promise<UserSettings> => {
  try {
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    const settingsDoc = await getDoc(userSettingsRef);
    
    if (!settingsDoc.exists()) {
      // If no settings exist, create default settings
      await setDoc(userSettingsRef, DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    
    return settingsDoc.data() as UserSettings;
  } catch (error) {
    console.error('Error getting user settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const updateUserSettings = async (
  user: User,
  settings: Partial<UserSettings>
): Promise<void> => {
  try {
    const userSettingsRef = doc(db, 'userSettings', user.uid);
    const currentSettings = await getUserSettings(user);
    await setDoc(userSettingsRef, {
      ...currentSettings,
      ...settings
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};
