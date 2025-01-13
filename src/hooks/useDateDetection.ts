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
  const lastDetectedDatesRef = useRef<string[]>([]);
  const { t } = useLanguage();

  const addDebugInfo = useCallback((info: string) => {
    setDebugInfo(prev => [info, ...prev.slice(0, 9)]);
    console.log('Debug:', info);
  }, []);

  const initializeCamera = useCallback(async () => {
    try {
      // Primero intentamos detener cualquier stream existente
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      const constraints: MediaTrackConstraints & ExtendedMediaTrackConstraintSet = {
        facingMode: { exact: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: 'continuous',
        exposureMode: 'continuous',
        whiteBalanceMode: 'continuous'
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: constraints,
          audio: false
        });
      } catch (err) {
        // Si falla con la cámara trasera, intentamos sin 'exact'
        constraints.facingMode = 'environment';
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: constraints,
          audio: false
        });
      }

      const videoTrack = stream.getVideoTracks()[0];
      trackRef.current = videoTrack;

      // Configurar la cámara para mejor captura de texto
      const capabilities = videoTrack.getCapabilities() as ExtendedMediaTrackCapabilities;
      const settings: ExtendedMediaTrackConstraintSet = {
        focusMode: capabilities.focusMode?.includes('continuous') ? 'continuous' : undefined,
        exposureMode: capabilities.exposureMode?.includes('continuous') ? 'continuous' : undefined,
        whiteBalanceMode: capabilities.whiteBalanceMode?.includes('continuous') ? 'continuous' : undefined
      };

      if (capabilities.torch) {
        addDebugInfo(t('products.flashAvailable'));
      }

      try {
        await videoTrack.applyConstraints({
          advanced: [settings]
        });
      } catch (err) {
        console.warn('No se pudieron aplicar configuraciones avanzadas:', err);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not found'));
            return;
          }

          const timeoutId = setTimeout(() => {
            reject(new Error('Video load timeout'));
          }, 10000);

          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeoutId);
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  addDebugInfo(t('products.videoStarted'));
                  resolve();
                })
                .catch(reject);
            }
          };

          videoRef.current.onerror = (e) => {
            clearTimeout(timeoutId);
            reject(new Error(`Video error: ${e}`));
          };
        });
      }

      addDebugInfo(t('products.cameraStarted'));
      return true;
    } catch (err) {
      console.error('Error al iniciar la cámara:', err);
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      setError(errorMessage);
      addDebugInfo(`${t('errors.initializationError')}: ${errorMessage}`);
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
          addDebugInfo(newFlashState ? t('products.flashEnabled') : t('products.flashDisabled'));
        } else {
          addDebugInfo(t('products.flashNotSupported'));
        }
      }
    } catch (err) {
      console.error('Error toggling flash:', err);
      addDebugInfo(t('errors.flashControl'));
    }
  }, [isFlashOn, addDebugInfo, t]);

  const stopScanning = useCallback(() => {
    addDebugInfo(t('products.stoppingScanner'));
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      if (isFlashOn && trackRef.current) {
        trackRef.current.applyConstraints({
          advanced: [{ torch: false } as ExtendedMediaTrackConstraintSet]
        }).catch(console.error);
        setIsFlashOn(false);
      }

      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addDebugInfo(t('products.cameraStopped'));
      });
      streamRef.current = null;
      trackRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    processingRef.current = false;
    setIsProcessing(false);
    lastDetectedDatesRef.current = [];
    addDebugInfo(t('products.scannerStopped'));
  }, [addDebugInfo, isFlashOn, t]);

  const processFrame = useCallback(async () => {
    if (processingRef.current || !videoRef.current?.readyState || videoRef.current.readyState < 2) {
      return false;
    }

    try {
      processingRef.current = true;
      setIsProcessing(true);
      
      const video = videoRef.current;
      const targetElement = document.querySelector('.scanner-target') as HTMLElement;
      
      if (!targetElement) {
        throw new Error('Scanner target element not found');
      }

      // Obtener las dimensiones y posición del área de escaneo en la pantalla
      const targetRect = targetElement.getBoundingClientRect();
      const videoRect = video.getBoundingClientRect();

      // Calcular la proporción entre las dimensiones del video y su elemento
      const scaleX = video.videoWidth / videoRect.width;
      const scaleY = video.videoHeight / videoRect.height;

      // Calcular las coordenadas del área de escaneo en el espacio del video
      const scanAreaWidth = targetRect.width * scaleX;
      const scanAreaHeight = targetRect.height * scaleY;
      const scanAreaX = (targetRect.left - videoRect.left) * scaleX;
      const scanAreaY = (targetRect.top - videoRect.top) * scaleY;

      // Crear el canvas con las dimensiones exactas del área de escaneo
      const canvas = document.createElement('canvas');
      canvas.width = scanAreaWidth;
      canvas.height = scanAreaHeight;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Fondo negro para mejor contraste
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Capturar exactamente el área de escaneo
      ctx.drawImage(video, scanAreaX, scanAreaY, scanAreaWidth, scanAreaHeight, 0, 0, canvas.width, canvas.height);

      // Aplicar mejoras de imagen
      ctx.filter = 'contrast(1.5) brightness(0.9) saturate(1.2)';
      ctx.drawImage(canvas, 0, 0);

      // Aplicar sharpening
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const sharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
      const pixels = imageData.data;
      const tempImageData = new ImageData(new Uint8ClampedArray(pixels), canvas.width, canvas.height);
      
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * canvas.width + (x + kx)) * 4 + c;
                sum += pixels[idx] * sharpenKernel[(ky + 1) * 3 + (kx + 1)];
              }
            }
            const idx = (y * canvas.width + x) * 4 + c;
            tempImageData.data[idx] = Math.max(0, Math.min(255, sum));
          }
        }
      }
      
      ctx.putImageData(tempImageData, 0, 0);
      
      const imageBase64 = canvas.toDataURL('image/jpeg', 1.0);
      setCurrentFrame(imageBase64);
      
      const { dates } = await ocrService.detectBatchDates(imageBase64);
      
      if (dates.length > 0) {
        lastDetectedDatesRef.current = [...lastDetectedDatesRef.current, ...dates].slice(-5);
        
        const dateFrequency = new Map<string, number>();
        lastDetectedDatesRef.current.forEach(date => {
          dateFrequency.set(date, (dateFrequency.get(date) || 0) + 1);
        });
        
        const consistentDates = Array.from(dateFrequency.entries())
          .filter(([_, freq]) => freq >= 2)
          .map(([date]) => date);
        
        if (consistentDates.length > 0) {
          const parsedDates = dateParserService.parseDates(consistentDates);
          const mostLikelyDate = dateParserService.getMostLikelyExpirationDate(parsedDates);
          
          if (mostLikelyDate) {
            addDebugInfo(t('products.dateDetected', { date: mostLikelyDate.toLocaleDateString() }));
            setDetectedDate(mostLikelyDate);
            return true;
          }
        }
      }
      
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      addDebugInfo(`${t('errors.generic')}: ${errorMessage}`);
      setError(errorMessage);
      return false;
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [addDebugInfo, t]);

  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setDetectedDate(null);
      setDebugInfo([]);
      setCurrentFrame(null);
      processingRef.current = false;
      lastDetectedDatesRef.current = [];
      addDebugInfo(t('products.initializingCamera'));

      const initialized = await initializeCamera();
      if (!initialized) {
        return;
      }

      // Esperar un momento para que la cámara se estabilice
      await new Promise(resolve => setTimeout(resolve, 1000));

      scanIntervalRef.current = setInterval(async () => {
        if (!processingRef.current) {
          const dateFound = await processFrame();
          if (dateFound) {
            stopScanning();
          }
        }
      }, 500);
    } catch (err) {
      console.error('Error al iniciar el escaneo:', err);
      const errorMessage = err instanceof Error ? err.message : t('errors.unknownError');
      setError(errorMessage);
      addDebugInfo(`${t('errors.initializationError')}: ${errorMessage}`);
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

interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  focusMode?: string[];
  exposureMode?: string[];
  whiteBalanceMode?: string[];
}

interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
  focusMode?: string;
  exposureMode?: string;
  whiteBalanceMode?: string;
}
