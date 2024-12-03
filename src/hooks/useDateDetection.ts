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
  toggleFlash: () => Promise<void>;
  isFlashOn: boolean;
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
  const [isFlashOn, setIsFlashOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef(false);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const { t } = useLanguage();

  const addDebugInfo = useCallback((info: string) => {
    setDebugInfo(prev => [info, ...prev.slice(0, 9)]);
    console.log('Debug:', info);
  }, []);

  const initializeCamera = useCallback(async () => {
    try {
      const constraints: MediaTrackConstraints & ExtendedMediaTrackConstraintSet = {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: 'continuous',
        exposureMode: 'continuous',
        whiteBalanceMode: 'continuous'
      };

      const stream = await navigator.mediaDevices.getUserMedia({ video: constraints });

      // Guardar la referencia del track para control del flash
      const videoTrack = stream.getVideoTracks()[0];
      trackRef.current = videoTrack;

      // Verificar capacidades del dispositivo
      const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
      if (capabilities.torch) {
        addDebugInfo('Flash disponible');
      } else {
        addDebugInfo('Flash no soportado en este dispositivo');
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              addDebugInfo('Video iniciado');
              resolve();
            };
          } else {
            resolve();
          }
        });
      }

      addDebugInfo('Cámara iniciada correctamente');
      return true;
    } catch (err) {
      console.error('Error al iniciar la cámara:', err);
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      setError(errorMessage);
      addDebugInfo(`Error al iniciar: ${errorMessage}`);
      return false;
    }
  }, [addDebugInfo, t]);

  const toggleFlash = useCallback(async () => {
    try {
      if (trackRef.current) {
        const capabilities = trackRef.current.getCapabilities() as ExtendedMediaTrackCapabilities;
        if (capabilities.torch) {
          const newFlashState = !isFlashOn;
          await trackRef.current.applyConstraints({
            advanced: [{ torch: newFlashState } as ExtendedMediaTrackConstraintSet]
          });
          setIsFlashOn(newFlashState);
          addDebugInfo(`Flash ${newFlashState ? 'activado' : 'desactivado'}`);
        } else {
          addDebugInfo('Este dispositivo no soporta flash');
        }
      } else {
        const initialized = await initializeCamera();
        if (initialized) {
          await toggleFlash();
        }
      }
    } catch (err) {
      console.error('Error toggling flash:', err);
      addDebugInfo('Error al controlar el flash');
    }
  }, [isFlashOn, addDebugInfo, initializeCamera]);

  const stopScanning = useCallback(() => {
    addDebugInfo('Deteniendo escáner...');
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      // Asegurarse de apagar el flash antes de detener
      if (isFlashOn && trackRef.current) {
        trackRef.current.applyConstraints({
          advanced: [{ torch: false } as ExtendedMediaTrackConstraintSet]
        }).catch(console.error);
        setIsFlashOn(false);
      }

      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addDebugInfo('Cámara detenida');
      });
      streamRef.current = null;
      trackRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    processingRef.current = false;
    setIsProcessing(false);
    addDebugInfo('Escáner detenido completamente');
  }, [addDebugInfo, isFlashOn]);

  const captureFrame = useCallback(async (): Promise<string> => {
    if (!videoRef.current) {
      throw new Error('Video element not found');
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    
    // Obtener las dimensiones reales del video y del elemento
    const videoAspectRatio = video.videoWidth / video.videoHeight;
    const elementAspectRatio = video.clientWidth / video.clientHeight;
    
    // Calcular las dimensiones efectivas del video en el elemento
    let effectiveWidth = video.videoWidth;
    let effectiveHeight = video.videoHeight;
    
    if (elementAspectRatio > videoAspectRatio) {
      effectiveWidth = video.videoHeight * elementAspectRatio;
    } else {
      effectiveHeight = video.videoWidth / elementAspectRatio;
    }
    
    // Calcular el área de escaneo
    const targetWidth = video.clientWidth * 0.6;
    const targetHeight = 60;
    
    // Convertir dimensiones del elemento a dimensiones del video
    const scanAreaWidth = (targetWidth / video.clientWidth) * effectiveWidth;
    const scanAreaHeight = (targetHeight / video.clientHeight) * effectiveHeight;
    
    // Calcular posición centrada
    const x = (video.videoWidth - scanAreaWidth) / 2;
    const y = (video.videoHeight - scanAreaHeight) / 2;

    // Configurar canvas con dimensiones proporcionales
    const canvasWidth = scanAreaWidth;
    const canvasHeight = scanAreaHeight * 2;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Fondo blanco para mejor contraste
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Configurar calidad
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Capturar el área específica y escalarla verticalmente
    ctx.drawImage(
      video,
      x, y, scanAreaWidth, scanAreaHeight,
      0, 0, canvasWidth, canvasHeight
    );

    // Aplicar mejoras
    ctx.filter = 'contrast(1.3) brightness(1.2)';
    ctx.drawImage(canvas, 0, 0);

    addDebugInfo(`Captura: ${Math.round(x)},${Math.round(y)} - ${Math.round(scanAreaWidth)}x${Math.round(scanAreaHeight)}`);
    
    return canvas.toDataURL('image/jpeg', 1.0);
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

      const initialized = await initializeCamera();
      if (!initialized) {
        return;
      }

      scanIntervalRef.current = setInterval(async () => {
        if (!processingRef.current) {
          const dateFound = await processFrame();
          if (dateFound) {
            stopScanning();
          }
        }
      }, 2000);
    } catch (err) {
      console.error('Error al iniciar el escaneo:', err);
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      setError(errorMessage);
      addDebugInfo(`Error al iniciar: ${errorMessage}`);
      stopScanning();
    }
  }, [processFrame, stopScanning, t, addDebugInfo, initializeCamera]);

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
    toggleFlash,
    isFlashOn,
    videoRef,
    debugInfo,
    currentFrame
  };
};

// Tipos para las capacidades extendidas de la cámara
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
  focusMode?: string;
  exposureMode?: string;
  whiteBalanceMode?: string;
}
