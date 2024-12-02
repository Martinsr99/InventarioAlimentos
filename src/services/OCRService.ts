import { createWorker } from 'tesseract.js';

interface OCRProgressEvent {
  detail: {
    status: string;
    progress?: number;
  };
}

interface LoggerMessage {
  status: string;
  progress?: number;
  workerId?: string;
}

class OCRService {
  private worker: any = null;

  private emitProgress(status: string) {
    const event = new CustomEvent<OCRProgressEvent['detail']>('ocr-progress', {
      detail: { status }
    });
    document.dispatchEvent(event);
    console.log('OCR Status:', status);
  }

  private async initWorker() {
    try {
      if (!this.worker) {
        this.emitProgress('Cargando motor OCR...');
        
        this.worker = await createWorker();
        
        this.emitProgress('Cargando idiomas...');
        await this.worker.loadLanguage('eng');
        
        this.emitProgress('Inicializando OCR...');
        await this.worker.initialize('eng');
        
        this.emitProgress('Configurando parámetros...');
        await this.worker.setParameters({
          tessedit_char_whitelist: '0123456789/',
          tessedit_pageseg_mode: 7,
          preserve_interword_spaces: '0'
        });

        this.emitProgress('Motor OCR listo');
      }
      return this.worker;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al inicializar OCR';
      this.emitProgress(`Error de inicialización: ${errorMessage}`);
      throw new Error(`Error al inicializar OCR: ${errorMessage}`);
    }
  }

  async detectText(imageBase64: string): Promise<string> {
    try {
      if (!imageBase64) {
        throw new Error('No se proporcionó imagen');
      }

      const worker = await this.initWorker();
      this.emitProgress('Analizando imagen...');

      const result = await worker.recognize(imageBase64);
      
      if (!result || !result.data || !result.data.text) {
        throw new Error('No se pudo extraer texto de la imagen');
      }

      const text = result.data.text;
      this.emitProgress(`Texto detectado: ${text}`);
      return text;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en el procesamiento OCR';
      this.emitProgress(`Error en OCR: ${errorMessage}`);
      console.error('Error en OCR:', error);
      throw new Error(`Error en OCR: ${errorMessage}`);
    }
  }

  async detectDates(imageBase64: string): Promise<string[]> {
    try {
      const text = await this.detectText(imageBase64);
      
      // Patrones específicos para dd/mm/yy
      const datePatterns = [
        /(\d{2})\/(\d{2})\/(\d{2})/g,  // dd/mm/yy con /
        /(\d{2})(\d{2})(\d{2})/g,      // ddmmyy sin separadores
      ];
      
      this.emitProgress('Buscando fechas en el texto...');

      const dates: string[] = [];
      for (const pattern of datePatterns) {
        const matches = text.match(pattern);
        if (matches) {
          // Formatear las fechas encontradas
          const formattedDates = matches.map(match => {
            if (match.includes('/')) return match;
            return `${match.slice(0,2)}/${match.slice(2,4)}/${match.slice(4)}`;
          });
          
          dates.push(...formattedDates);
          this.emitProgress(`Fechas encontradas: ${formattedDates.join(', ')}`);
        }
      }
      
      if (dates.length === 0) {
        this.emitProgress('No se encontraron fechas en el texto');
      }
      
      return dates;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al procesar fechas';
      this.emitProgress(`Error al procesar fechas: ${errorMessage}`);
      console.error('Error al procesar fechas:', error);
      throw new Error(`Error al procesar fechas: ${errorMessage}`);
    }
  }

  async terminate(): Promise<void> {
    try {
      if (this.worker) {
        this.emitProgress('Terminando OCR...');
        await this.worker.terminate();
        this.worker = null;
        this.emitProgress('OCR terminado');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al terminar OCR';
      this.emitProgress(`Error al terminar OCR: ${errorMessage}`);
      console.error('Error al terminar OCR:', error);
    }
  }
}

export const ocrService = new OCRService();
