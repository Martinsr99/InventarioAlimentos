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
    // Si el año tiene 2 dígitos, asumimos que es 20XX
    if (year < 100) {
      return year + 2000;
    }
    return year;
  }

  private parseDate(dateStr: string): ParsedDate | null {
    // Remover espacios en blanco
    dateStr = dateStr.trim();

    // Diferentes patrones de fecha
    const patterns = [
      // dd/mm/yyyy o dd-mm-yyyy
      {
        regex: /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/,
        dayIndex: 1,
        monthIndex: 2,
        yearIndex: 3
      },
      // yyyy/mm/dd o yyyy-mm-dd
      {
        regex: /^(\d{2,4})[-/.](\d{1,2})[-/.](\d{1,2})$/,
        dayIndex: 3,
        monthIndex: 2,
        yearIndex: 1
      }
    ];

    for (const pattern of patterns) {
      const match = dateStr.match(pattern.regex);
      if (match) {
        const day = parseInt(match[pattern.dayIndex], 10);
        const month = parseInt(match[pattern.monthIndex], 10);
        let year = parseInt(match[pattern.yearIndex], 10);
        
        year = this.normalizeYear(year);

        if (this.isValidDate(day, month, year)) {
          return { day, month, year };
        }
      }
    }

    return null;
  }

  parseDates(dateStrings: string[]): Date[] {
    const validDates: Date[] = [];

    for (const dateStr of dateStrings) {
      const parsed = this.parseDate(dateStr);
      if (parsed) {
        const { year, month, day } = parsed;
        validDates.push(new Date(year, month - 1, day));
      }
    }

    return validDates;
  }

  // Formatea una fecha al formato deseado (dd/mm/yyyy)
  formatDate(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Obtiene la fecha más probable de caducidad
  getMostLikelyExpirationDate(dates: Date[]): Date | null {
    if (dates.length === 0) return null;

    // Filtrar fechas pasadas
    const now = new Date();
    const futureDates = dates.filter(date => date > now);

    if (futureDates.length === 0) return null;

    // Ordenar fechas y tomar la más cercana
    futureDates.sort((a, b) => a.getTime() - b.getTime());
    return futureDates[0];
  }
}

export const dateParserService = new DateParserService();
