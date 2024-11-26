import React, { useState, useEffect } from 'react';
import {
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonButtons,
    IonIcon,
    IonSpinner,
} from '@ionic/react';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import PasswordRequirements, { PasswordRequirement } from './PasswordRequirements';

interface AuthFormProps {
    isRegistering: boolean;
    isLoading: boolean;
    onSubmit: (email: string, password: string) => Promise<void>;
    initialRequirements: PasswordRequirement[];
}

const AuthForm: React.FC<AuthFormProps> = ({
    isRegistering,
    isLoading,
    onSubmit,
    initialRequirements,
}) => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [requirements, setRequirements] = useState<PasswordRequirement[]>(initialRequirements);

    useEffect(() => {
        setShowPassword(isRegistering);
    }, [isRegistering]);

    const updatePasswordRequirements = (newPassword: string) => {
        if (isRegistering) {
            const updatedRequirements = requirements.map(req => ({
                ...req,
                met: req.check(newPassword)
            }));
            setRequirements(updatedRequirements);
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        updatePasswordRequirements(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(email, password);
    };

    return (
        <form onSubmit={handleSubmit}>
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
                    onIonInput={e => handlePasswordChange(e.detail.value || '')}
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
                <PasswordRequirements requirements={requirements} />
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
    );
};

export default AuthForm;
