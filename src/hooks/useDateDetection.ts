import { useState, useCallback, useRef, useEffect } from 'react';
import { ocrService } from '../services/OCRService';
import { imagePreprocessingService } from '../services/ImagePreprocessingService';
import { dateParserService } from '../services/DateParserService';
import { useLanguage } from '../contexts/LanguageContext';

interface UseDateDetectionResult {
  isProcessing: boolean;
  detectedDate: Date | null;
  error: string | null;
  startScanning: () => Promise<void>;
  stopScanning: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  debugInfo: string[];
  currentFrame: string | null;
}

export const useDateDetection = (): UseDateDetectionResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectedDate, setDetectedDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false);
  const { t } = useLanguage();

  const addDebugInfo = useCallback((info: string) => {
    setDebugInfo(prev => [info, ...prev.slice(0, 9)]);
    console.log('Debug:', info);
  }, []);

  const stopScanning = useCallback(() => {
    addDebugInfo('Deteniendo escáner...');
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addDebugInfo('Cámara detenida');
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    processingRef.current = false;
    setIsProcessing(false);
    addDebugInfo('Escáner detenido completamente');
  }, [addDebugInfo]);

  const captureFrame = useCallback(async (): Promise<string> => {
    if (!videoRef.current) {
      throw new Error('Video element not found');
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    // Calcular dimensiones del área de escaneo (rectángulo horizontal)
    const scanAreaWidth = video.videoWidth * 0.8; // 80% del ancho
    const scanAreaHeight = scanAreaWidth * 0.2; // Altura proporcional para fecha
    
    // Calcular posición del área de escaneo (centrada)
    const x = (video.videoWidth - scanAreaWidth) / 2;
    const y = (video.videoHeight - scanAreaHeight) / 2;

    // Configurar canvas para el área de escaneo
    canvas.width = scanAreaWidth;
    canvas.height = scanAreaHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Dibujar solo el área de escaneo
    ctx.drawImage(
      video,
      x, y, scanAreaWidth, scanAreaHeight, // Área fuente (recorte)
      0, 0, scanAreaWidth, scanAreaHeight  // Área destino (canvas completo)
    );

    // Aplicar mejoras básicas
    ctx.filter = 'contrast(1.2) brightness(1.1)';
    
    const frameBase64 = canvas.toDataURL('image/jpeg', 1.0);
    addDebugInfo(`Frame capturado: ${canvas.width}x${canvas.height}`);
    return frameBase64;
  }, [addDebugInfo]);

  const processFrame = useCallback(async () => {
    if (processingRef.current) {
      return false;
    }

    if (!videoRef.current?.readyState || videoRef.current.readyState < 2) {
      addDebugInfo('Video no está listo');
      return false;
    }

    try {
      processingRef.current = true;
      setIsProcessing(true);
      addDebugInfo('Capturando frame...');
      
      const imageBase64 = await captureFrame();
      
      addDebugInfo('Preprocesando imagen...');
      const processedImage = await imagePreprocessingService.optimizeExpirationDateImage(imageBase64);
      setCurrentFrame(processedImage);
      
      addDebugInfo('Detectando fechas...');
      const detectedDates = await ocrService.detectDates(processedImage);

      if (detectedDates.length > 0) {
        addDebugInfo(`Fechas detectadas: ${detectedDates.join(', ')}`);
        const parsedDates = dateParserService.parseDates(detectedDates);
        addDebugInfo(`Fechas parseadas: ${parsedDates.length}`);
        
        const mostLikelyDate = dateParserService.getMostLikelyExpirationDate(parsedDates);

        if (mostLikelyDate) {
          addDebugInfo(`Fecha seleccionada: ${mostLikelyDate.toLocaleDateString()}`);
          setDetectedDate(mostLikelyDate);
          return true;
        }
      } else {
        addDebugInfo('No se encontraron fechas');
      }
      
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      addDebugInfo(`Error: ${errorMessage}`);
      setError(errorMessage);
      return false;
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [captureFrame, addDebugInfo]);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setDetectedDate(null);
      setDebugInfo([]);
      setCurrentFrame(null);
      processingRef.current = false;
      addDebugInfo('Iniciando cámara...');

      const constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          focusMode: 'continuous'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      addDebugInfo('Cámara iniciada correctamente');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          addDebugInfo('Video iniciado');
          
          // Procesar frames cada 2000ms
          scanIntervalRef.current = setInterval(async () => {
            if (!processingRef.current) {
              const dateFound = await processFrame();
              if (dateFound) {
                stopScanning();
              }
            }
          }, 2000);
        };

        videoRef.current.onerror = (e) => {
          addDebugInfo(`Error en video: ${e}`);
          setError('Error al iniciar el video');
        };
      }
    } catch (err) {
      console.error('Error al iniciar el escaneo:', err);
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      setError(errorMessage);
      addDebugInfo(`Error al iniciar: ${errorMessage}`);
      stopScanning();
    }
  }, [processFrame, stopScanning, t, addDebugInfo]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  useEffect(() => {
    const handleOCRProgress = (event: CustomEvent) => {
      if (event.detail?.status) {
        addDebugInfo(event.detail.status);
      }
    };

    document.addEventListener('ocr-progress', handleOCRProgress as EventListener);

    return () => {
      document.removeEventListener('ocr-progress', handleOCRProgress as EventListener);
    };
  }, [addDebugInfo]);

  return {
    isProcessing,
    detectedDate,
    error,
    startScanning,
    stopScanning,
    videoRef,
    debugInfo,
    currentFrame
  };
};
