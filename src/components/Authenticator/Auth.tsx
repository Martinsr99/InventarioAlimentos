import React, { useEffect } from 'react';
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
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { showError, showSuccess } from '../../services/AuthNotificationService';
import LanguageSwitch from '../common/LanguageSwitch';
import AuthForm from './AuthForm';
import ResetPasswordModal from './ResetPasswordModal';
import { initialRequirements } from './authUtils';
import banana from '../../assets/images/optimized/banana.png';
import fresa from '../../assets/images/optimized/FRESA.png';
import grana from '../../assets/images/optimized/grana.png';
import naranja from '../../assets/images/optimized/naranja.png';
import pina from '../../assets/images/optimized/pina.png';
import './Auth.css';

const Auth: React.FC = () => {
    const { t, language } = useLanguage();
    const {
        isRegistering,
        isLoading,
        showForgotPasswordModal,
        email,
        setIsRegistering,
        setShowForgotPasswordModal,
        setEmail,
        handleAuth
    } = useAuth();

    useEffect(() => {
        auth.languageCode = language;
    }, [language]);

    const handleAuthSubmit = async (email: string, password: string) => {
        const result = await handleAuth(email, password);
        if (!result.success && result.error) {
            showError(result.error.title, result.error.message, t('common.ok'));
        }
    };

    const handleResetPasswordSuccess = () => {
        showSuccess(
            t('auth.resetPasswordSuccess'),
            t('auth.resetPasswordSuccessMessage'),
            t('common.ok')
        );
    };

    return (
        <IonGrid>
            <div className="floating-fruits">
                <img src={banana} alt="" className="fruit fruit-1" />
                <img src={fresa} alt="" className="fruit fruit-2" />
                <img src={grana} alt="" className="fruit fruit-3" />
                <img src={naranja} alt="" className="fruit fruit-4" />
                <img src={pina} alt="" className="fruit fruit-5" />
            </div>
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
                                onSubmit={handleAuthSubmit}
                                initialRequirements={initialRequirements(t)}
                            />

                            <IonButton
                                expand="block"
                                fill="clear"
                                onClick={() => setIsRegistering(!isRegistering)}
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
                onSuccess={handleResetPasswordSuccess}
                onError={(title, message) => showError(title, message, t('common.ok'))}
            />
        </IonGrid>
    );
};

export default Auth;
