import { AuthError } from 'firebase/auth';

type TranslateFunction = (key: string) => string;

export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const getFirebaseErrorMessage = (error: AuthError, t: TranslateFunction): { title: string; message: string } => {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return {
                title: t('auth.errors.emailInUse'),
                message: t('auth.errors.emailInUseMessage')
            };
        case 'auth/invalid-email':
            return {
                title: t('auth.errors.invalidEmail'),
                message: t('auth.errors.pleaseEnterValidEmail')
            };
        case 'auth/operation-not-allowed':
            return {
                title: t('auth.errors.operationNotAllowed'),
                message: t('auth.errors.operationNotAllowedMessage')
            };
        case 'auth/weak-password':
            return {
                title: t('auth.errors.weakPassword'),
                message: t('auth.errors.weakPasswordMessage')
            };
        case 'auth/user-disabled':
            return {
                title: t('auth.errors.accountDisabled'),
                message: t('auth.errors.accountDisabledMessage')
            };
        case 'auth/user-not-found':
            return {
                title: t('auth.errors.accountNotFound'),
                message: t('auth.errors.accountNotFoundMessage')
            };
        case 'auth/wrong-password':
            return {
                title: t('auth.errors.incorrectPassword'),
                message: t('auth.errors.incorrectPasswordMessage')
            };
        case 'auth/too-many-requests':
            return {
                title: t('auth.errors.tooManyAttempts'),
                message: t('auth.errors.tooManyAttemptsMessage')
            };
        case 'auth/invalid-credential':
            return {
                title: t('auth.errors.invalidCredentials'),
                message: t('auth.errors.invalidCredentialsMessage')
            };
        default:
            return {
                title: t('common.error'),
                message: t('common.tryAgain')
            };
    }
};

export const initialRequirements = (t: TranslateFunction) => [
    {
        text: t('auth.requirements.length'),
        check: (pass: string) => pass.length >= 8,
        met: false
    },
    {
        text: t('auth.requirements.uppercase'),
        check: (pass: string) => /[A-Z]/.test(pass),
        met: false
    },
    {
        text: t('auth.requirements.lowercase'),
        check: (pass: string) => /[a-z]/.test(pass),
        met: false
    },
    {
        text: t('auth.requirements.number'),
        check: (pass: string) => /[0-9]/.test(pass),
        met: false
    }
];
