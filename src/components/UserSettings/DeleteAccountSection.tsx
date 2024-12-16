import React, { useState } from 'react';
import {
  IonButton,
  IonIcon,
  IonModal,
  IonInput,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonText,
  IonButtons,
  IonItem,
  IonLabel
} from '@ionic/react';
import { trashBinOutline, closeOutline } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { auth } from '../../firebaseConfig';
import { deleteUser } from 'firebase/auth';
import './DeleteAccountSection.css';

const DeleteAccountSection: React.FC = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const { t } = useLanguage();

  const handleDeleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
        setShowConfirmation(false);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
    }
  };

  const isConfirmValid = confirmText.toLowerCase() === t('common.confirm').toLowerCase();

  return (
    <>
      <div className="delete-account-container">
        <IonButton
          expand="block"
          className="delete-account-button"
          onClick={() => setShowConfirmation(true)}
        >
          <IonIcon slot="start" icon={trashBinOutline} />
          {t('settings.deleteAccount')}
        </IonButton>
      </div>

      <IonModal
        isOpen={showConfirmation}
        onDidDismiss={() => {
          setShowConfirmation(false);
          setConfirmText('');
        }}
      >
        <IonHeader>
          <IonToolbar color="danger">
            <IonTitle>{t('settings.deleteAccountConfirmHeader')}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={() => setShowConfirmation(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <IonText>
            <p>{t('settings.deleteAccountConfirmMessage')}</p>
          </IonText>

          <div className="confirmation-section">
            <IonText color="medium">
              <p>{t('settings.deleteAccountConfirmInstructions')}</p>
            </IonText>
            
            <IonItem lines="none" className="confirm-input-item">
              <IonInput
                value={confirmText}
                onIonInput={e => setConfirmText(e.detail.value || '')}
                placeholder={confirmText ? '' : t('settings.deleteAccountConfirmPlaceholder')}
                className="confirm-input"
              />
            </IonItem>
          </div>

          <div className="modal-buttons">
            <IonButton
              expand="block"
              onClick={() => setShowConfirmation(false)}
              fill="outline"
            >
              {t('common.cancel')}
            </IonButton>
            <IonButton
              expand="block"
              color="danger"
              onClick={handleDeleteAccount}
              disabled={!isConfirmValid}
              className={isConfirmValid ? 'delete-confirm-button' : ''}
            >
              {t('common.confirm')}
            </IonButton>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default DeleteAccountSection;
