class ImagePreprocessingService {
  async preprocessImage(imageBase64: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Aumentar resolución para mejor detección
        const scale = 2;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Configurar suavizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dibujar imagen escalada
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Obtener datos de la imagen
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convertir a escala de grises y aumentar contraste
        this.toGrayscale(data);
        this.increaseContrast(data, 2.0);
        this.denoise(data, canvas.width);
        this.sharpen(data, canvas.width);
        this.threshold(data);

        // Actualizar canvas con la imagen procesada
        ctx.putImageData(imageData, 0, 0);

        // Convertir canvas a base64
        try {
          const processedImageBase64 = canvas.toDataURL('image/png', 1.0);
          resolve(processedImageBase64);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = imageBase64;
    });
  }

  private toGrayscale(data: Uint8ClampedArray): void {
    for (let i = 0; i < data.length; i += 4) {
      // Usar pesos optimizados para texto
      const gray = data[i] * 0.2989 + data[i + 1] * 0.5870 + data[i + 2] * 0.1140;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
  }

  private increaseContrast(data: Uint8ClampedArray, contrast: number): void {
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = this.truncate(factor * (data[i] - 128) + 128);
      data[i + 1] = this.truncate(factor * (data[i + 1] - 128) + 128);
      data[i + 2] = this.truncate(factor * (data[i + 2] - 128) + 128);
    }
  }

  private denoise(data: Uint8ClampedArray, width: number): void {
    const tempData = new Uint8ClampedArray(data.length);
    tempData.set(data);

    const kernel = 1;
    const height = data.length / 4 / width;

    for (let y = kernel; y < height - kernel; y++) {
      for (let x = kernel; x < width - kernel; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let count = 0;

          // Mediana adaptativa
          const values: number[] = [];
          for (let ky = -kernel; ky <= kernel; ky++) {
            for (let kx = -kernel; kx <= kernel; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              values.push(tempData[idx]);
            }
          }

          values.sort((a, b) => a - b);
          const median = values[Math.floor(values.length / 2)];
          const idx = (y * width + x) * 4 + c;
          data[idx] = median;
        }
      }
    }
  }

  private sharpen(data: Uint8ClampedArray, width: number): void {
    const tempData = new Uint8ClampedArray(data.length);
    tempData.set(data);

    // Kernel de enfoque más agresivo para números
    const kernel = [
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
    ];

    const height = data.length / 4 / width;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += tempData[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const idx = (y * width + x) * 4 + c;
          data[idx] = this.truncate(sum);
        }
      }
    }
  }

  private threshold(data: Uint8ClampedArray): void {
    // Calcular umbral usando el método de Otsu
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }

    let total = data.length / 4;
    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let i = 0; i < 256; i++) {
      wB += histogram[i];
      if (wB === 0) continue;
      wF = total - wB;
      if (wF === 0) break;

      sumB += i * histogram[i];
      let mB = sumB / wB;
      let mF = (sum - sumB) / wF;

      let variance = wB * wF * (mB - mF) * (mB - mF);
      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = i;
      }
    }

    // Aplicar umbral con histéresis
    const lowThreshold = threshold * 0.8;
    const highThreshold = threshold * 1.2;

    for (let i = 0; i < data.length; i += 4) {
      const v = data[i];
      const binarized = v > highThreshold ? 255 : (v < lowThreshold ? 0 : v);
      data[i] = data[i + 1] = data[i + 2] = binarized;
    }
  }

  private truncate(value: number): number {
    return Math.min(255, Math.max(0, value));
  }

  async optimizeExpirationDateImage(imageBase64: string): Promise<string> {
    try {
      console.log('Iniciando optimización de imagen...');
      const processedImage = await this.preprocessImage(imageBase64);
      console.log('Imagen optimizada correctamente');
      return processedImage;
    } catch (error) {
      console.error('Error optimizing expiration date image:', error);
      throw error;
    }
  }
}

export const imagePreprocessingService = new ImagePreprocessingService();
