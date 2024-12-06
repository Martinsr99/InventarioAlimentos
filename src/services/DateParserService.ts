interface ParsedDate {
  day: number;
  month: number;
  year: number;
}

class DateParserService {
  private isValidDate(day: number, month: number, year: number): boolean {
    const date = new Date(year, month - 1, day);
    return date.getDate() === day &&
           date.getMonth() === month - 1 &&
           date.getFullYear() === year;
  }

  private normalizeYear(year: number): number {
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;

    // Si el año tiene 2 dígitos
    if (year < 100) {
      // Si el año es mayor que los últimos dos dígitos del año actual + 10,
      // asumimos que es del siglo anterior
      const twoDigitYear = currentYear % 100;
      if (year > twoDigitYear + 10) {
        return (currentCentury - 100) + year;
      }
      // Si no, asumimos que es del siglo actual
      return currentCentury + year;
    }
    return year;
  }

  private cleanDateString(dateStr: string): string {
    // Remover espacios y caracteres no deseados
    return dateStr.trim()
      .replace(/\s+/g, '') // Eliminar espacios
      .replace(/[^0-9/.-]/g, '') // Solo mantener números y separadores
      .replace(/[/.-]+/g, '/'); // Normalizar separadores a /
  }

  private parseDate(dateStr: string): ParsedDate | null {
    // Limpiar y normalizar la cadena
    dateStr = this.cleanDateString(dateStr);

    // Diferentes patrones de fecha
    const patterns = [
      // mm/yyyy
      {
        regex: /^(\d{1,2})\/(\d{4})$/,
        dayIndex: null,
        monthIndex: 1,
        yearIndex: 2
      },
      // mm/yy
      {
        regex: /^(\d{1,2})\/(\d{2})$/,
        dayIndex: null,
        monthIndex: 1,
        yearIndex: 2
      },
      // dd/mm/yy
      {
        regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
        dayIndex: 1,
        monthIndex: 2,
        yearIndex: 3
      },
      // dd/mm/yyyy
      {
        regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
        dayIndex: 1,
        monthIndex: 2,
        yearIndex: 3
      },
      // yyyy/mm/dd
      {
        regex: /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
        dayIndex: 3,
        monthIndex: 2,
        yearIndex: 1
      },
      // ddmmyy (sin separadores)
      {
        regex: /^(\d{2})(\d{2})(\d{2})$/,
        dayIndex: 1,
        monthIndex: 2,
        yearIndex: 3
      },
      // mmyy (sin separadores)
      {
        regex: /^(\d{2})(\d{2})$/,
        dayIndex: null,
        monthIndex: 1,
        yearIndex: 2
      }
    ];

    for (const pattern of patterns) {
      const match = dateStr.match(pattern.regex);
      if (match) {
        const month = parseInt(match[pattern.monthIndex], 10);
        let year = parseInt(match[pattern.yearIndex], 10);
        let day = pattern.dayIndex ? parseInt(match[pattern.dayIndex], 10) : 1;
        
        // Normalizar el año
        year = this.normalizeYear(year);

        // Validar rangos básicos antes de crear la fecha
        if (month >= 1 && month <= 12 &&
            day >= 1 && day <= 31 &&
            year >= 2000 && year <= 2100) {
          
          // Validar la fecha completa
          if (this.isValidDate(day, month, year)) {
            console.log(`Fecha válida encontrada: ${day}/${month}/${year}`);
            return { day, month, year };
          }
        }
      }
    }

    return null;
  }

  parseDates(dateStrings: string[]): Date[] {
    console.log('Intentando parsear fechas:', dateStrings);
    const validDates: Date[] = [];

    for (const dateStr of dateStrings) {
      console.log('Procesando:', dateStr);
      const parsed = this.parseDate(dateStr);
      if (parsed) {
        const { year, month, day } = parsed;
        // Aquí ya no restamos 1 al mes porque ya se hizo en isValidDate
        const date = new Date(year, month, day);
        console.log('Fecha parseada:', this.formatDate(date));
        validDates.push(date);
      }
    }

    return validDates;
  }

  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getMostLikelyExpirationDate(dates: Date[]): Date | null {
    if (dates.length === 0) return null;

    console.log('Fechas candidatas:', dates.map(d => this.formatDate(d)));

    // Filtrar fechas pasadas y muy lejanas
    const now = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 5); // Máximo 5 años en el futuro

    const validDates = dates.filter(date => 
      date > now && date < maxDate
    );

    if (validDates.length === 0) return null;

    // Ordenar fechas y tomar la más cercana
    validDates.sort((a, b) => a.getTime() - b.getTime());
    const selectedDate = validDates[0];
    console.log('Fecha seleccionada:', this.formatDate(selectedDate));
    return selectedDate;
  }
}

export const dateParserService = new DateParserService();
