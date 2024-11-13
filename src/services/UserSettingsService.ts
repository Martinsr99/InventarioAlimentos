import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { User } from 'firebase/auth';

export interface UserSettings {
  language: 'en' | 'es';
  // Add other user settings here as needed
}

const DEFAULT_SETTINGS: UserSettings = {
  language: 'en'
};

export const getUserSettings = async (user: User): Promise<UserSettings> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'userSettings', user.uid));
    if (settingsDoc.exists()) {
      return settingsDoc.data() as UserSettings;
    } else {
      // If no settings exist, create default settings
      await setDoc(doc(db, 'userSettings', user.uid), DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
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
    await updateDoc(doc(db, 'userSettings', user.uid), settings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};
