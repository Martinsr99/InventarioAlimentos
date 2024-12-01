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

        // Establecer dimensiones del canvas
        canvas.width = img.width;
        canvas.height = img.height;

        // Dibujar imagen original
        ctx.drawImage(img, 0, 0);

        // Obtener datos de la imagen
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convertir a escala de grises y aumentar contraste
        for (let i = 0; i < data.length; i += 4) {
          // Convertir a escala de grises
          const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          
          // Aumentar contraste
          const contrast = 1.5; // Factor de contraste
          const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
          const newValue = factor * (gray - 128) + 128;
          
          // Aplicar umbral para binarizar la imagen
          const threshold = 128;
          const finalValue = newValue > threshold ? 255 : 0;

          data[i] = finalValue;     // R
          data[i + 1] = finalValue; // G
          data[i + 2] = finalValue; // B
        }

        // Actualizar canvas con la imagen procesada
        ctx.putImageData(imageData, 0, 0);

        // Convertir canvas a base64
        try {
          const processedImageBase64 = canvas.toDataURL('image/png');
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

  // Método específico para optimizar imágenes de fechas de caducidad
  async optimizeExpirationDateImage(imageBase64: string): Promise<string> {
    try {
      // Preprocesar la imagen para mejorar la legibilidad del texto
      const processedImage = await this.preprocessImage(imageBase64);
      return processedImage;
    } catch (error) {
      console.error('Error optimizing expiration date image:', error);
      throw error;
    }
  }
}

export const imagePreprocessingService = new ImagePreprocessingService();
