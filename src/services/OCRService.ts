import { createWorker } from 'tesseract.js';

interface OCRProgressEvent {
  detail: {
    status: string;
    progress?: number;
  };
}

class OCRService {
  private worker: any = null;

  private emitProgress(status: string, progress?: number) {
    const event = new CustomEvent<OCRProgressEvent['detail']>('ocr-progress', {
      detail: { status, progress }
    });
    document.dispatchEvent(event);
  }

  private async initWorker() {
    if (!this.worker) {
      this.emitProgress('Iniciando motor OCR...');
      this.worker = await createWorker();
      this.emitProgress('Cargando idioma...');
      await this.worker.loadLanguage('eng');
      this.emitProgress('Inicializando...');
      await this.worker.initialize('eng');
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789/-.',
        tessedit_pageseg_mode: 7
      });
      this.emitProgress('Motor OCR listo');
    }
    return this.worker;
  }

  async detectText(imageBase64: string): Promise<string> {
    try {
      this.emitProgress('Iniciando detección de texto...');
      const worker = await this.initWorker();
      
      this.emitProgress('Procesando imagen...');
      const { data: { text } } = await worker.recognize(imageBase64);

      this.emitProgress(`Texto detectado: ${text}`);
      return text;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      this.emitProgress(`Error en OCR: ${errorMsg}`);
      throw error;
    }
  }

  async detectDates(imageBase64: string): Promise<string[]> {
    const text = await this.detectText(imageBase64);
    
    // Patrones comunes de fechas
    const datePatterns = [
      /\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/g,  // dd/mm/yyyy o dd-mm-yyyy
      /\d{2,4}[-/.]\d{1,2}[-/.]\d{1,2}/g,  // yyyy/mm/dd o yyyy-mm-dd
      /\d{1,2}[-/.]\d{1,2}[-/.]\d{2}/g,    // dd/mm/yy
      /\d{2}[-/.]\d{2}[-/.]\d{2}/g,        // yy/mm/dd
    ];
    
    this.emitProgress('Buscando fechas en el texto...');

    const dates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        dates.push(...matches);
        this.emitProgress(`Fechas encontradas: ${matches.join(', ')}`);
      }
    }
    
    if (dates.length === 0) {
      this.emitProgress('No se encontraron fechas en el texto');
    }
    
    return dates;
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      this.emitProgress('Terminando OCR...');
      await this.worker.terminate();
      this.worker = null;
      this.emitProgress('OCR terminado');
    }
  }
}

export const ocrService = new OCRService();
