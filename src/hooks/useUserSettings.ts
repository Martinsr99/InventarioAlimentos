import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { getUserSettings, updateUserSettings } from '../services/UserSettingsService';
import { useLanguage } from '../contexts/LanguageContext';

export const useUserSettings = (user: User | null) => {
  const [profilePicture, setProfilePicture] = useState('/images/profile/apple.png');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const settings = await getUserSettings(user);
        if (settings.profilePicture) {
          setProfilePicture(settings.profilePicture);
        }
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
      setProfilePicture(newPicture);
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

  return {
    profilePicture,
    language,
    isLoading,
    error,
    handleProfilePictureChange,
    toggleLanguage
  };
};
