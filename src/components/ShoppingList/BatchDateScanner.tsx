import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { camera, flash, flashOff, close } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDateDetection } from '../../hooks/useDateDetection';
import './BatchDateScanner.css';

interface BatchDateScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDateDetected: (itemId: string, date: Date) => void;
  items: Array<{ id: string; name: string }>;
}

export const BatchDateScanner: React.FC<BatchDateScannerProps> = ({
  isOpen,
  onClose,
  onDateDetected,
  items,
}) => {
  const { t } = useLanguage();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const {
    isProcessing,
    detectedDate,
    error,
    startScanning,
    stopScanning,
    toggleFlash,
    isFlashOn,
    videoRef,
    debugInfo,
  } = useDateDetection();

  useEffect(() => {
    if (detectedDate) {
      const currentItem = items[currentItemIndex];
      if (currentItem) {
        onDateDetected(currentItem.id, detectedDate);
        if (currentItemIndex < items.length - 1) {
          setCurrentItemIndex(prev => prev + 1);
          // Reiniciar el escaneo para el siguiente item
          setTimeout(() => {
            startScanning();
          }, 1000);
        } else {
          // Hemos terminado con todos los items
          onClose();
        }
      }
    }
  }, [detectedDate, currentItemIndex, items, onDateDetected, onClose, startScanning]);

  useEffect(() => {
    if (isOpen) {
      setCurrentItemIndex(0);
      startScanning();
    } else {
      stopScanning();
    }
  }, [isOpen, startScanning, stopScanning]);

  const currentItem = items[currentItemIndex];

  return (
    <IonModal 
      isOpen={isOpen} 
      onDidDismiss={onClose} 
      className="batch-scanner-modal"
      mode="ios"
    >
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>
              <IonIcon slot="icon-only" icon={close} />
            </IonButton>
          </IonButtons>
          <IonTitle>{t('shoppingList.scanExpiryDates')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="scanner-container">
          <div className="current-item">
            <h2>{currentItem?.name}</h2>
            <p className="progress">
              {t('shoppingList.scanProgress', { current: currentItemIndex + 1, total: items.length })}
            </p>
          </div>

          <div className="video-container">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="scanner-video"
            />
            <div className="scanner-target" />
          </div>

          {isProcessing && (
            <div className="processing-indicator">
              <IonSpinner name="crescent" color="light" />
              <IonText color="light">{t('products.processing')}</IonText>
            </div>
          )}

          {error && (
            <div className="error-message">
              <IonText color="light">{error}</IonText>
            </div>
          )}

          <div className="scanner-controls">
            <IonButton
              fill="clear"
              onClick={toggleFlash}
              color="light"
            >
              <IonIcon slot="icon-only" icon={isFlashOn ? flashOff : flash} />
            </IonButton>
          </div>

          {debugInfo.length > 0 && (
            <div className="debug-info">
              {debugInfo.map((info, index) => (
                <p key={index} className="debug-line">{info}</p>
              ))}
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};
