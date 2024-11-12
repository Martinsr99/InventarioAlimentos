import React, { useState, useEffect } from 'react';
import { auth } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import Swal from 'sweetalert2';
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
    InputChangeEventDetail
} from '@ionic/react';
import { checkmarkCircle, closeCircle, eyeOutline, eyeOffOutline } from 'ionicons/icons';

interface PasswordRequirement {
    text: string;
    check: (password: string) => boolean;
    met: boolean;
}

const initialRequirements: PasswordRequirement[] = [
    {
        text: 'At least 8 characters',
        check: (pass) => pass.length >= 8,
        met: false
    },
    {
        text: 'One uppercase letter',
        check: (pass) => /[A-Z]/.test(pass),
        met: false
    },
    {
        text: 'One lowercase letter',
        check: (pass) => /[a-z]/.test(pass),
        met: false
    },
    {
        text: 'One number',
        check: (pass) => /[0-9]/.test(pass),
        met: false
    }
];

const Auth: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isRegistering, setIsRegistering] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [requirements, setRequirements] = useState<PasswordRequirement[]>(initialRequirements);

    // Set initial password visibility based on registration state
    useEffect(() => {
        setShowPassword(isRegistering);
    }, [isRegistering]);

    const resetForm = () => {
        setPassword('');
        setEmail('');
        setRequirements(initialRequirements);
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
            confirmButtonText: 'OK',
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

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const getFirebaseErrorMessage = (error: AuthError): { title: string; message: string } => {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return {
                    title: 'Email Already Registered',
                    message: 'This email is already registered. Please try logging in instead.'
                };
            case 'auth/invalid-email':
                return {
                    title: 'Invalid Email',
                    message: 'Please enter a valid email address.'
                };
            case 'auth/operation-not-allowed':
                return {
                    title: 'Operation Not Allowed',
                    message: 'Email/password sign up is not enabled. Please contact support.'
                };
            case 'auth/weak-password':
                return {
                    title: 'Weak Password',
                    message: 'Please choose a stronger password.'
                };
            case 'auth/user-disabled':
                return {
                    title: 'Account Disabled',
                    message: 'This account has been disabled. Please contact support.'
                };
            case 'auth/user-not-found':
                return {
                    title: 'Account Not Found',
                    message: 'No account found with this email. Please register first.'
                };
            case 'auth/wrong-password':
                return {
                    title: 'Incorrect Password',
                    message: 'Incorrect password. Please try again.'
                };
            case 'auth/too-many-requests':
                return {
                    title: 'Too Many Attempts',
                    message: 'Too many failed attempts. Please try again later.'
                };
            case 'auth/invalid-credential':
                return {
                    title: 'Invalid Credentials',
                    message: 'Invalid credentials. Please check your email and password.'
                };
            default:
                return {
                    title: 'Error',
                    message: 'An error occurred. Please try again.'
                };
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        // Email validation
        if (!validateEmail(email)) {
            showError('Invalid Email', 'Please enter a valid email address');
            return;
        }

        // Password validation for registration
        if (isRegistering && !requirements.every(req => req.met)) {
            showError('Password Requirements', 'Please meet all password requirements');
            return;
        }

        setIsLoading(true);
        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
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

    return (
        <IonGrid>
            <IonRow>
                <IonCol size="12" sizeMd="6" offsetMd="3">
                    <IonCard>
                        <IonCardHeader>
                            <IonCardTitle>{isRegistering ? 'Register' : 'Login'}</IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <form onSubmit={handleAuth}>
                                <IonItem lines="full" className="ion-margin-bottom">
                                    <IonLabel position="stacked">Email</IonLabel>
                                    <IonInput
                                        type="email"
                                        value={email}
                                        placeholder="Enter your email"
                                        onIonChange={e => setEmail(e.detail.value!)}
                                        required
                                        className="ion-padding-top"
                                    />
                                </IonItem>

                                <IonItem lines="full" className="ion-margin-bottom">
                                    <IonLabel position="stacked">Password</IonLabel>
                                    <IonInput
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        placeholder="Enter your password"
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
                                        <IonNote>Password requirements:</IonNote>
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
                                        isRegistering ? 'Register' : 'Login'
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
                                    ? 'Already have an account? Login' 
                                    : 'Don\'t have an account? Register'}
                            </IonButton>
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
            `}</style>
        </IonGrid>
    );
};

export default Auth;
