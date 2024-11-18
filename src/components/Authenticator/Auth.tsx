import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, AuthError } from 'firebase/auth';
import Swal from 'sweetalert2';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSwitch from '../common/LanguageSwitch';
import { updateUserSettings } from '../../services/UserSettingsService';
import {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    IonNote,
    IonIcon,
    IonButtons,
    InputChangeEventDetail,
    IonToolbar
} from '@ionic/react';
import { checkmarkCircle, closeCircle, eyeOutline, eyeOffOutline } from 'ionicons/icons';

interface PasswordRequirement {
    text: string;
    check: (password: string) => boolean;
    met: boolean;
}

const initialRequirements = (t: (key: string) => string): PasswordRequirement[] => [
    {
        text: t('auth.requirements.length'),
        check: (pass) => pass.length >= 8,
        met: false
    },
    {
        text: t('auth.requirements.uppercase'),
        check: (pass) => /[A-Z]/.test(pass),
        met: false
    },
    {
        text: t('auth.requirements.lowercase'),
        check: (pass) => /[a-z]/.test(pass),
        met: false
    },
    {
        text: t('auth.requirements.number'),
        check: (pass) => /[0-9]/.test(pass),
        met: false
    }
];

const Auth: React.FC = () => {
    const { t, language, setLanguage } = useLanguage();
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [requirements, setRequirements] = useState<PasswordRequirement[]>(() => initialRequirements(t));

    // Set Firebase language based on current language context
    useEffect(() => {
        auth.languageCode = language;
    }, [language]);

    // Set initial password visibility based on registration state
    useEffect(() => {
        setShowPassword(isRegistering);
    }, [isRegistering]);

    const resetForm = () => {
        setPassword('');
        setEmail('');
        setRequirements(initialRequirements(t));
    };

    const updatePasswordRequirements = (newPassword: string) => {
        if (isRegistering) {
            const updatedRequirements = requirements.map(req => ({
                ...req,
                met: req.check(newPassword)
            }));
            setRequirements(updatedRequirements);
        }
    };

    const handlePasswordChange = (event: CustomEvent<InputChangeEventDetail>) => {
        const newPassword = event.detail.value || '';
        setPassword(newPassword);
        updatePasswordRequirements(newPassword);
    };

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

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const getFirebaseErrorMessage = (error: AuthError): { title: string; message: string } => {
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

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        // Email validation
        if (!validateEmail(email)) {
            showError(t('auth.errors.invalidEmail'), t('auth.errors.pleaseEnterValidEmail'));
            return;
        }

        // Password validation for registration
        if (isRegistering && !requirements.every(req => req.met)) {
            showError(t('auth.errors.passwordRequirements'), t('auth.errors.meetAllRequirements'));
            return;
        }

        setIsLoading(true);
        try {
            if (isRegistering) {
                // Capturar el idioma actual antes del registro
                const currentLanguage = language;
                
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // Forzar el idioma en localStorage y el contexto
                localStorage.setItem('language', currentLanguage);
                setLanguage(currentLanguage);
                
                // Guardar en Firestore
                await updateUserSettings(userCredential.user, { 
                    language: currentLanguage,
                    profilePicture: '/images/profile/apple.png'
                });
                
                // Forzar el idioma en Firebase Auth
                auth.languageCode = currentLanguage;
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error: any) {
            const errorInfo = getFirebaseErrorMessage(error);
            showError(errorInfo.title, errorInfo.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!validateEmail(email)) {
            showError(t('auth.errors.invalidEmail'), t('auth.errors.pleaseEnterValidEmail'));
            return;
        }

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email, {
                url: window.location.origin,
                handleCodeInApp: false
            });
            showSuccess(t('auth.resetPasswordSuccess'), t('auth.resetPasswordSuccessMessage'));
        } catch (error: any) {
            const errorInfo = getFirebaseErrorMessage(error);
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
                            <form onSubmit={handleAuth}>
                                <IonItem lines="full" className="ion-margin-bottom">
                                    <IonLabel position="stacked">{t('auth.email')}</IonLabel>
                                    <IonInput
                                        type="email"
                                        value={email}
                                        placeholder={t('auth.enterEmail')}
                                        onIonChange={e => setEmail(e.detail.value!)}
                                        required
                                        className="ion-padding-top"
                                    />
                                </IonItem>

                                <IonItem lines="full" className="ion-margin-bottom">
                                    <IonLabel position="stacked">{t('auth.password')}</IonLabel>
                                    <IonInput
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        placeholder={t('auth.enterPassword')}
                                        onIonInput={handlePasswordChange}
                                        required
                                        className="ion-padding-top"
                                    />
                                    <IonButtons slot="end">
                                        <IonButton
                                            onClick={() => setShowPassword(!showPassword)}
                                            fill="clear"
                                        >
                                            <IonIcon
                                                icon={showPassword ? eyeOutline : eyeOffOutline}
                                                color="medium"
                                                style={{ fontSize: '1.2rem' }}
                                            />
                                        </IonButton>
                                    </IonButtons>
                                </IonItem>

                                {isRegistering && (
                                    <div className="password-requirements">
                                        <IonNote>{t('auth.passwordRequirements')}</IonNote>
                                        {requirements.map((req, index) => (
                                            <div key={index} className="requirement-item">
                                                <IonIcon 
                                                    icon={req.met ? checkmarkCircle : closeCircle} 
                                                    color={req.met ? 'success' : 'medium'}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                <span style={{ 
                                                    color: req.met ? 'var(--ion-color-success)' : 'var(--ion-color-medium)'
                                                }}>
                                                    {req.text}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <IonButton 
                                    expand="block"
                                    type="submit"
                                    className="ion-margin-top"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <IonSpinner name="crescent" />
                                    ) : (
                                        isRegistering ? t('auth.register') : t('auth.login')
                                    )}
                                </IonButton>
                            </form>

                            <IonButton
                                expand="block"
                                fill="clear"
                                onClick={() => {
                                    setIsRegistering(!isRegistering);
                                    resetForm();
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
                                    onClick={handlePasswordReset}
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

            <style>{`
                .auth-modal {
                    border-radius: 10px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
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
