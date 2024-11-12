import React, { useState } from 'react';
import { auth } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import {
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner,
    IonList
} from '@ionic/react';

const Auth: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isRegistering, setIsRegistering] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    const validatePassword = (pass: string): string[] => {
        const errors: string[] = [];
        if (pass.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(pass)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(pass)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/[0-9]/.test(pass)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*]/.test(pass)) {
            errors.push('Password must contain at least one special character (!@#$%^&*)');
        }
        return errors;
    };

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const getFirebaseErrorMessage = (error: AuthError): string => {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Please try logging in instead.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/operation-not-allowed':
                return 'Email/password sign up is not enabled. Please contact support.';
            case 'auth/weak-password':
                return 'Please choose a stronger password.';
            case 'auth/user-disabled':
                return 'This account has been disabled. Please contact support.';
            case 'auth/user-not-found':
                return 'No account found with this email. Please register first.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/invalid-credential':
                return 'Invalid credentials. Please check your email and password.';
            default:
                return 'An error occurred. Please try again.';
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setPasswordErrors([]);

        // Email validation
        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        // Password validation for registration
        if (isRegistering) {
            const errors = validatePassword(password);
            if (errors.length > 0) {
                setPasswordErrors(errors);
                return;
            }
        }

        setIsLoading(true);
        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error: any) {
            setError(getFirebaseErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (isRegistering) {
            setPasswordErrors(validatePassword(value));
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
                            {error && (
                                <IonText color="danger">
                                    <p>{error}</p>
                                </IonText>
                            )}
                            
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
                                        type="password"
                                        value={password}
                                        placeholder="Enter your password"
                                        onIonChange={e => handlePasswordChange(e.detail.value!)}
                                        required
                                        className="ion-padding-top"
                                    />
                                </IonItem>

                                {isRegistering && passwordErrors.length > 0 && (
                                    <IonList className="ion-margin-bottom">
                                        {passwordErrors.map((error, index) => (
                                            <IonText key={index} color="danger">
                                                <p className="ion-no-margin">{error}</p>
                                            </IonText>
                                        ))}
                                    </IonList>
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
                                    setError('');
                                    setPasswordErrors([]);
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
        </IonGrid>
    );
};

export default Auth;
