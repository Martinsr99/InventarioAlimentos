import React, { useState, useEffect } from 'react';
import {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonGrid,
    IonRow,
    IonCol,
    IonButton,
    IonToolbar,
    IonButtons,
} from '@ionic/react';
import { auth } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import Swal from 'sweetalert2';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitch from '../common/LanguageSwitch';
import { updateUserSettings } from '../../services/UserSettingsService';
import { initializeUserSharing } from '../../services/SharedProductsService';
import AuthForm from './AuthForm';
import ResetPasswordModal from './ResetPasswordModal';
import { validateEmail, getFirebaseErrorMessage, initialRequirements } from './authUtils';

const Auth: React.FC = () => {
    const { t, language, setLanguage } = useLanguage();
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');

    useEffect(() => {
        auth.languageCode = language;
    }, [language]);

    const showError = (title: string, message: string) => {
        let timerInterval: NodeJS.Timeout;
        let isHovered = false;

        Swal.fire({
            title,
            text: message,
            icon: 'error',
            confirmButtonText: t('common.ok'),
            confirmButtonColor: '#3880ff',
            background: '#ffffff',
            heightAuto: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: {
                popup: 'auth-modal',
                title: 'auth-modal-title',
                htmlContainer: 'auth-modal-content',
                confirmButton: 'auth-modal-button'
            },
            didOpen: (popup) => {
                popup.addEventListener('mouseenter', () => {
                    isHovered = true;
                    Swal.stopTimer();
                });
                popup.addEventListener('mouseleave', () => {
                    isHovered = false;
                    Swal.resumeTimer();
                });
            },
            willClose: () => {
                clearInterval(timerInterval);
            }
        });
    };

    const showSuccess = (title: string, message: string) => {
        Swal.fire({
            title,
            text: message,
            icon: 'success',
            confirmButtonText: t('common.ok'),
            confirmButtonColor: '#3880ff',
            background: '#ffffff',
            heightAuto: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: {
                popup: 'auth-modal',
                title: 'auth-modal-title',
                htmlContainer: 'auth-modal-content',
                confirmButton: 'auth-modal-button'
            }
        });
    };

    const handleAuth = async (email: string, password: string) => {
        if (!validateEmail(email)) {
            showError(t('auth.errors.invalidEmail'), t('auth.errors.pleaseEnterValidEmail'));
            return;
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
        } catch (error: any) {
            const errorInfo = getFirebaseErrorMessage(error, t);
            showError(errorInfo.title, errorInfo.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <IonGrid>
            <IonRow>
                <IonCol size="12" sizeMd="6" offsetMd="3">
                    <IonCard>
                        <IonCardHeader className="auth-header">
                            <IonToolbar style={{ '--background': 'transparent' } as any}>
                                <IonCardTitle slot="start" style={{ margin: 0 }}>
                                    {isRegistering ? t('auth.register') : t('auth.login')}
                                </IonCardTitle>
                                <IonButtons slot="end">
                                    <LanguageSwitch />
                                </IonButtons>
                            </IonToolbar>
                        </IonCardHeader>
                        <IonCardContent>
                            <AuthForm
                                isRegistering={isRegistering}
                                isLoading={isLoading}
                                onSubmit={handleAuth}
                                initialRequirements={initialRequirements(t)}
                            />

                            <IonButton
                                expand="block"
                                fill="clear"
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                }}
                                className="ion-margin-top"
                                disabled={isLoading}
                            >
                                {isRegistering 
                                    ? t('auth.alreadyHaveAccount')
                                    : t('auth.dontHaveAccount')}
                            </IonButton>

                            {!isRegistering && (
                                <IonButton
                                    expand="block"
                                    fill="clear"
                                    onClick={() => {
                                        setEmail(email);
                                        setShowForgotPasswordModal(true);
                                    }}
                                    className="ion-margin-top"
                                    disabled={isLoading}
                                >
                                    {t('auth.forgotPassword')}
                                </IonButton>
                            )}
                        </IonCardContent>
                    </IonCard>
                </IonCol>
            </IonRow>

            <ResetPasswordModal
                isOpen={showForgotPasswordModal}
                onDismiss={() => setShowForgotPasswordModal(false)}
                initialEmail={email}
                onSuccess={() => {
                    showSuccess(
                        t('auth.resetPasswordSuccess'),
                        t('auth.resetPasswordSuccessMessage')
                    );
                }}
                onError={showError}
            />

            <style>{`
                .auth-modal {
                    --height: 100%;
                    --width: 100%;
                }
                @media (min-width: 768px) {
                    .auth-modal {
                        --height: auto;
                        --width: 400px;
                        --border-radius: 8px;
                    }
                }
                .auth-modal ion-content {
                    --padding-top: 20px;
                    --padding-bottom: 20px;
                }
                .auth-modal ion-toolbar {
                    --background: var(--ion-color-primary);
                    --color: var(--ion-color-primary-contrast);
                }
                .auth-modal ion-title {
                    color: var(--ion-color-primary-contrast);
                }
                .custom-back-button {
                    --color: var(--ion-color-primary-contrast);
                    margin-left: 8px;
                }
                .auth-modal-title {
                    font-size: 1.5rem;
                    color: #1f1f1f;
                }
                .auth-modal-content {
                    font-size: 1rem;
                    color: #4a4a4a;
                }
                .auth-modal-button {
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .password-requirements {
                    margin: 16px 0;
                    padding: 0 16px;
                }
                .requirement-item {
                    display: flex;
                    align-items: center;
                    margin: 8px 0;
                    font-size: 0.9rem;
                }
                .auth-header ion-toolbar {
                    padding: 0;
                }
            `}</style>
        </IonGrid>
    );
};

export default Auth;
