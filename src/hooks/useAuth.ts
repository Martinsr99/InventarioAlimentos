import { useState } from 'react';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { updateUserSettings } from '../services/UserSettingsService';
import { initializeUserSharing } from '../services/SharedProductsService';
import { validateEmail, getFirebaseErrorMessage } from '../components/Authenticator/authUtils';
import { useLanguage } from '../contexts/LanguageContext';

interface UseAuthReturn {
  isRegistering: boolean;
  isLoading: boolean;
  showForgotPasswordModal: boolean;
  email: string;
  setIsRegistering: (value: boolean) => void;
  setShowForgotPasswordModal: (value: boolean) => void;
  setEmail: (value: string) => void;
  handleAuth: (email: string, password: string) => Promise<{
    success: boolean;
    error?: { title: string; message: string };
  }>;
}

export const useAuth = (): UseAuthReturn => {
  const { t, language, setLanguage } = useLanguage();
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');

  const handleAuth = async (email: string, password: string) => {
    if (!validateEmail(email)) {
      return {
        success: false,
        error: {
          title: t('auth.errors.invalidEmail'),
          message: t('auth.errors.pleaseEnterValidEmail')
        }
      };
    }

    setIsLoading(true);
    try {
      if (isRegistering) {
        const currentLanguage = language;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        localStorage.setItem('language', currentLanguage);
        setLanguage(currentLanguage);
        
        await Promise.all([
          updateUserSettings(userCredential.user, { 
            language: currentLanguage,
            profilePicture: '/images/profile/apple.png'
          }),
          initializeUserSharing(userCredential.user)
        ]);
        
        auth.languageCode = currentLanguage;
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      return { success: true };
    } catch (error: any) {
      const errorInfo = getFirebaseErrorMessage(error, t);
      return {
        success: false,
        error: errorInfo
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isRegistering,
    isLoading,
    showForgotPasswordModal,
    email,
    setIsRegistering,
    setShowForgotPasswordModal,
    setEmail,
    handleAuth
  };
};
