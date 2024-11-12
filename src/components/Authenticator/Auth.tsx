import React, { useState } from 'react';
import { auth } from '../../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
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
    IonCol
} from '@ionic/react';

const Auth: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isRegistering, setIsRegistering] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error: any) {
            setError(error.message);
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
                                        onIonChange={e => setPassword(e.detail.value!)}
                                        required
                                        className="ion-padding-top"
                                    />
                                </IonItem>

                                <IonButton 
                                    expand="block"
                                    type="submit"
                                    className="ion-margin-top"
                                >
                                    {isRegistering ? 'Register' : 'Login'}
                                </IonButton>
                            </form>

                            <IonButton
                                expand="block"
                                fill="clear"
                                onClick={() => setIsRegistering(!isRegistering)}
                                className="ion-margin-top"
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
