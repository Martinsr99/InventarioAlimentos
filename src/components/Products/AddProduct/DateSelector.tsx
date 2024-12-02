import React, { useEffect, useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonInput,
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonTitle,
  IonDatetime,
  IonIcon,
  IonSpinner,
  IonToast,
  IonText,
  IonCard,
  IonCardContent,
  IonProgressBar,
  IonImg,
} from '@ionic/react';
import { camera } from 'ionicons/icons';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useDateDetection } from '../../../hooks/useDateDetection';
import './DateSelector.css';

interface DateSelectorProps {
  expiryDate: string;
  selectedDate: string;
  isOpen: boolean;
  onOpen: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  onDateChange: (value: string | string[] | null | undefined) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({
  expiryDate,
  selectedDate,
  isOpen,
  onOpen,
  onCancel,
  onConfirm,
  onDateChange,
}) => {
  const { t } = useLanguage();
  const {
    isProcessing,
    detectedDate,
    error,
    startScanning,
    stopScanning,
    videoRef,
    debugInfo,
    currentFrame
  } = useDateDetection();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCameraClick = async () => {
    try {
      setIsInitializing(true);
      setIsScannerOpen(true);
      await startScanning();
    } catch (err) {
      console.error('Error al iniciar la cámara:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleScannerClose = () => {
    stopScanning();
    setIsScannerOpen(false);
  };

  useEffect(() => {
    if (detectedDate) {
      onDateChange(detectedDate.toISOString());
      handleScannerClose();
    }
  }, [detectedDate, onDateChange]);

  useEffect(() => {
    return () => {
      if (isScannerOpen) {
        stopScanning();
      }
    };
  }, [isScannerOpen]);

  return (
    <>
      <IonItem className="date-input" lines="none">
        <IonLabel position="stacked">{t('products.expiryDate')}</IonLabel>
        <div className="date-input-container">
          <IonInput
            readonly
            value={formatDisplayDate(expiryDate)}
            placeholder={t('products.selectDate')}
            className="date-display"
            onClick={onOpen}
          />
          <IonButton
            fill="clear"
            onClick={handleCameraClick}
            disabled={isProcessing || isInitializing}
            className="camera-button"
          >
            {isProcessing || isInitializing ? (
              <IonSpinner name="crescent" />
            ) : (
              <IonIcon icon={camera} slot="icon-only" />
            )}
          </IonButton>
        </div>
      </IonItem>

      <IonModal 
        isOpen={isOpen}
        onDidDismiss={onCancel}
        className="date-picker-modal"
        mode="ios"
        backdropDismiss={false}
        animated={true}
      >
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton 
                onClick={onCancel} 
                fill="clear"
                className="modal-button"
              >
                {t('common.cancel')}
              </IonButton>
            </IonButtons>
            <IonTitle>{t('products.expiryDate')}</IonTitle>
            <IonButtons slot="end">
              <IonButton 
                onClick={onConfirm} 
                fill="clear" 
                strong={true}
                className="modal-button"
              >
                {t('common.ok')}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div className="datetime-container">
            <IonDatetime
              value={selectedDate || expiryDate || new Date().toISOString()}
              onIonChange={(e) => onDateChange(e.detail.value)}
              presentation="date"
              preferWheel={true}
              showDefaultButtons={false}
              firstDayOfWeek={1}
              locale="es-ES"
              className="custom-datetime"
              min={new Date().toISOString().split('T')[0]}
              color="dark"
              mode="ios"
              yearValues={Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i)}
              style={{
                '--background': 'var(--ion-background-color)',
                '--wheel-fade-background-rgb': 'var(--ion-background-color-rgb)',
                '--wheel-item-color': 'var(--ion-text-color)',
                '--wheel-selected-item-color': 'var(--ion-text-color)',
                '--wheel-selected-item-background': 'var(--ion-background-color)',
                '--highlight-background': 'var(--ion-background-color)',
                '--highlight-color': 'var(--ion-text-color)',
                '--wheel-highlight-background': 'var(--ion-background-color)',
                '--wheel-col-background': 'var(--ion-background-color)',
                '--wheel-item-font-size': '22px',
                '--wheel-item-padding-start': '20px',
                '--wheel-item-padding-end': '20px',
                '--wheel-selected-item-font-weight': '600',
                '--wheel-picker-option-background': 'var(--ion-background-color)',
                '--wheel-picker-option-selected-background': 'var(--ion-background-color)',
                '--wheel-picker-background': 'var(--ion-background-color)',
                '--wheel-fade-mask-background': 'var(--ion-background-color)',
                'background': 'var(--ion-background-color)'
              }}
            />
          </div>
        </IonContent>
      </IonModal>

      <IonModal
        isOpen={isScannerOpen}
        onDidDismiss={handleScannerClose}
        className="scanner-modal"
        backdropDismiss={false}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('products.scanExpiryDate')}</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={handleScannerClose}>
                {t('common.cancel')}
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="scanner-container">
            {isProcessing && (
              <IonProgressBar type="indeterminate" color="primary" className="scanner-progress" />
            )}
            <video
              ref={videoRef}
              className="scanner-video"
              playsInline
              autoPlay
              muted
            />
            <div className="scanner-overlay">
              <div className="scanner-target"></div>
            </div>
            {currentFrame && (
              <div className="frame-preview">
                <IonCard>
                  <IonCardContent>
                    <IonText color="medium">
                      <h3>Frame actual:</h3>
                    </IonText>
                    <IonImg src={currentFrame} className="frame-image" />
                  </IonCardContent>
                </IonCard>
              </div>
            )}
            <IonCard className="debug-card">
              <IonCardContent>
                <IonText color="medium">
                  <h2>Estado del escáner:</h2>
                  {isInitializing && <p>Iniciando cámara...</p>}
                  {isProcessing && <p>Procesando imagen...</p>}
                  {debugInfo.map((info, index) => (
                    <p key={index}>{info}</p>
                  ))}
                </IonText>
              </IonCardContent>
            </IonCard>
          </div>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={!!error}
        message={error || ''}
        duration={3000}
        position="bottom"
        color="danger"
      />
    </>
  );
};

export default DateSelector;
