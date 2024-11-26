import React, { useState } from 'react';
import {
    IonModal,
    IonPage,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSpinner,
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { auth } from '../../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

interface ResetPasswordModalProps {
    isOpen: boolean;
    onDismiss: () => void;
    initialEmail: string;
    onSuccess: () => void;
    onError: (title: string, message: string) => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
    isOpen,
    onDismiss,
    initialEmail,
    onSuccess,
    onError
}) => {
    const { t } = useLanguage();
    const [resetEmail, setResetEmail] = useState(initialEmail);
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateEmail(resetEmail)) {
            onError(t('auth.errors.invalidEmail'), t('auth.errors.pleaseEnterValidEmail'));
            return;
        }

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail, {
                url: window.location.origin,
                handleCodeInApp: false
            });
            onDismiss();
            onSuccess();
            setResetEmail('');
        } catch (error: any) {
            const errorInfo = getFirebaseErrorMessage(error);
            onError(errorInfo.title, errorInfo.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getFirebaseErrorMessage = (error: any): { title: string; message: string } => {
        switch (error.code) {
            case 'auth/user-not-found':
                return {
                    title: t('auth.errors.accountNotFound'),
                    message: t('auth.errors.accountNotFoundMessage')
                };
            case 'auth/invalid-email':
                return {
                    title: t('auth.errors.invalidEmail'),
                    message: t('auth.errors.pleaseEnterValidEmail')
                };
            case 'auth/too-many-requests':
                return {
                    title: t('auth.errors.tooManyAttempts'),
                    message: t('auth.errors.tooManyAttemptsMessage')
                };
            default:
                return {
                    title: t('common.error'),
                    message: t('common.tryAgain')
                };
        }
    };

    return (
        <IonModal
            isOpen={isOpen}
            onDidDismiss={onDismiss}
            className="auth-modal"
        >
            <IonPage className="ion-page">
                <IonHeader>
                    <IonToolbar color="primary">
                        <IonButtons slot="start">
                            <IonButton 
                                onClick={onDismiss}
                                className="custom-back-button"
                            >
                                <IonIcon 
                                    icon={arrowBack} 
                                    slot="icon-only"
                                    style={{ fontSize: '24px' }}
                                />
                            </IonButton>
                        </IonButtons>
                        <IonTitle>{t('auth.resetPassword')}</IonTitle>
                    </IonToolbar>
                </IonHeader>
                <IonContent>
                    <form onSubmit={handlePasswordReset} className="ion-padding">
                        <IonItem lines="full">
                            <IonLabel position="stacked">{t('auth.email')}</IonLabel>
                            <IonInput
                                type="email"
                                value={resetEmail}
                                placeholder={t('auth.enterEmail')}
                                onIonChange={e => setResetEmail(e.detail.value!)}
                                required
                                className="ion-padding-top"
                            />
                        </IonItem>
                        <IonButton
                            expand="block"
                            type="submit"
                            className="ion-margin-top"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <IonSpinner name="crescent" />
                            ) : (
                                t('auth.sendResetLink')
                            )}
                        </IonButton>
                    </form>
                </IonContent>
            </IonPage>
        </IonModal>
    );
};

export default ResetPasswordModal;
