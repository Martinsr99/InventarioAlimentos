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
                                <IonItem>
                                    <IonLabel position="floating">Email</IonLabel>
                                    <IonInput
                                        type="email"
                                        value={email}
                                        onIonChange={e => setEmail(e.detail.value!)}
                                        required
                                    />
                                </IonItem>

                                <IonItem>
                                    <IonLabel position="floating">Password</IonLabel>
                                    <IonInput
                                        type="password"
                                        value={password}
                                        onIonChange={e => setPassword(e.detail.value!)}
                                        required
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
