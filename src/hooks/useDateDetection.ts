import { useState, useCallback, useRef, useEffect } from 'react';
import { ocrService } from '../services/OCRService';
import { imagePreprocessingService } from '../services/ImagePreprocessingService';
import { dateParserService } from '../services/DateParserService';
import { useLanguage } from '../contexts/LanguageContext';

interface OCRProgressEvent {
  detail: {
    status: string;
    progress?: number;
  };
}

interface UseDateDetectionResult {
  isProcessing: boolean;
  detectedDate: Date | null;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  debugInfo: string[];
}

export const useDateDetection = (): UseDateDetectionResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedDate, setDetectedDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useLanguage();

  const addDebugInfo = useCallback((info: string) => {
    setDebugInfo(prev => [info, ...prev.slice(0, 9)]);
  }, []);

  // Escuchar eventos de progreso del OCR
  useEffect(() => {
    const handleOCRProgress = (event: CustomEvent<OCRProgressEvent['detail']>) => {
      addDebugInfo(event.detail.status);
    };

    document.addEventListener('ocr-progress', handleOCRProgress as EventListener);

    return () => {
      document.removeEventListener('ocr-progress', handleOCRProgress as EventListener);
    };
  }, [addDebugInfo]);

  const stopScanning = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    addDebugInfo('Escáner detenido');
  }, [addDebugInfo]);

  const captureFrame = useCallback(async (): Promise<string> => {
    if (!videoRef.current) {
      throw new Error('Video element not found');
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    ctx.drawImage(videoRef.current, 0, 0);
    addDebugInfo(`Frame capturado: ${canvas.width}x${canvas.height}`);
    return canvas.toDataURL('image/jpeg');
  }, [addDebugInfo]);

  const processFrame = useCallback(async () => {
    try {
      const imageBase64 = await captureFrame();
      addDebugInfo('Procesando imagen...');
      
      // Preprocesar la imagen para mejorar el OCR
      const processedImage = await imagePreprocessingService.optimizeExpirationDateImage(imageBase64);
      addDebugInfo('Imagen preprocesada');

      // Detectar texto en la imagen
      const detectedDates = await ocrService.detectDates(processedImage);

      if (detectedDates.length > 0) {
        // Parsear las fechas detectadas
        const parsedDates = dateParserService.parseDates(detectedDates);
        addDebugInfo(`Fechas parseadas: ${parsedDates.length}`);
        
        // Obtener la fecha más probable
        const mostLikelyDate = dateParserService.getMostLikelyExpirationDate(parsedDates);

        if (mostLikelyDate) {
          addDebugInfo(`Fecha seleccionada: ${mostLikelyDate.toLocaleDateString()}`);
          setDetectedDate(mostLikelyDate);
          stopScanning();
          return true;
        }
      }
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      addDebugInfo(`Error: ${errorMessage}`);
      return false;
    }
  }, [captureFrame, stopScanning, addDebugInfo]);

  const startScanning = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setDebugInfo([]);
      addDebugInfo('Iniciando cámara...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      addDebugInfo('Cámara iniciada correctamente');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          addDebugInfo('Video iniciado');
          
          // Procesar frames cada 1000ms para dar tiempo al OCR
          scanIntervalRef.current = setInterval(async () => {
            const dateFound = await processFrame();
            if (dateFound) {
              setIsProcessing(false);
            }
          }, 1000);
        };
      }
    } catch (err) {
      console.error('Error al iniciar el escaneo:', err);
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      setError(errorMessage);
      addDebugInfo(`Error al iniciar: ${errorMessage}`);
      setIsProcessing(false);
    }
  }, [processFrame, t, addDebugInfo]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    isProcessing,
    detectedDate,
    error,
    startScanning,
    stopScanning,
    videoRef,
    debugInfo
  };
};
