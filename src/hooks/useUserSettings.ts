import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getUserSettings, updateUserSettings, UserSettings } from '../services/UserSettingsService';
import { useLanguage } from '../contexts/LanguageContext';

export const useUserSettings = (user: User | null) => {
  const [settings, setSettings] = useState<UserSettings>({
    language: 'es',
    email: '',
    profilePicture: '/images/profile/apple.png',
    autoDeleteExpired: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const userSettings = await getUserSettings(user);
        setSettings(userSettings);
      } catch (error) {
        setError(t('errors.settingsLoad'));
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSettings();
  }, [user, t]);

  const handleProfilePictureChange = async (newPicture: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await updateUserSettings(user, { profilePicture: newPicture });
      setSettings(prev => ({
        ...prev,
        profilePicture: newPicture
      }));
      setError(null);
    } catch (error) {
      setError(t('errors.settingsSave'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    try {
      setIsLoading(true);
      await updateUserSettings(user, newSettings);
      setSettings(prev => ({
        ...prev,
        ...newSettings
      }));
      setError(null);
    } catch (error) {
      setError(t('errors.settingsSave'));
    } finally {
      setIsLoading(false);
    }
  };

  return {
    settings,
    language,
    isLoading,
    error,
    handleProfilePictureChange,
    toggleLanguage,
    updateSettings
  };
};
