import { useState } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useLanguage } from '../contexts/LanguageContext';
import { initializeUserSharing } from '../services/FriendService';

interface AuthResult {
  success: boolean;
  error?: {
    title: string;
    message: string;
  };
}

export const useAuth = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [email, setEmail] = useState('');
  const { t } = useLanguage();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password);
  };

  const handleLogin = async (email: string, password: string): Promise<User | null> => {
    if (!validateEmail(email)) {
      setError(t('auth.errors.pleaseEnterValidEmail'));
      return null;
    }

    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setError(null);
      return userCredential.user;
    } catch (error: any) {
      console.error('Login error:', error);
      switch (error.code) {
        case 'auth/user-disabled':
          setError(t('auth.errors.accountDisabledMessage'));
          break;
        case 'auth/user-not-found':
          setError(t('auth.errors.accountNotFoundMessage'));
          break;
        case 'auth/wrong-password':
          setError(t('auth.errors.incorrectPasswordMessage'));
          break;
        case 'auth/too-many-requests':
          setError(t('auth.errors.tooManyAttemptsMessage'));
          break;
        default:
          setError(t('auth.errors.invalidCredentialsMessage'));
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string): Promise<User | null> => {
    if (!validateEmail(email)) {
      setError(t('auth.errors.pleaseEnterValidEmail'));
      return null;
    }

    if (!validatePassword(password)) {
      setError(t('auth.errors.meetAllRequirements'));
      return null;
    }

    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await initializeUserSharing(userCredential.user);
      setError(null);
      return userCredential.user;
    } catch (error: any) {
      console.error('Registration error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError(t('auth.errors.emailInUseMessage'));
          break;
        case 'auth/operation-not-allowed':
          setError(t('auth.errors.operationNotAllowedMessage'));
          break;
        case 'auth/weak-password':
          setError(t('auth.errors.weakPasswordMessage'));
          break;
        default:
          setError(t('auth.errors.invalidCredentialsMessage'));
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuth = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const user = isRegistering 
        ? await handleRegister(email, password)
        : await handleLogin(email, password);

      if (user) {
        return { success: true };
      } else {
        return {
          success: false,
          error: {
            title: t('auth.errors.authError'),
            message: error || t('auth.errors.invalidCredentialsMessage')
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          title: t('auth.errors.authError'),
          message: t('auth.errors.invalidCredentialsMessage')
        }
      };
    }
  };

  return {
    error,
    isLoading,
    isRegistering,
    showForgotPasswordModal,
    email,
    handleAuth,
    handleLogin,
    handleRegister,
    validateEmail,
    validatePassword,
    setError,
    setIsRegistering,
    setShowForgotPasswordModal,
    setEmail
  };
};
