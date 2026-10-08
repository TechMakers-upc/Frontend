import { Pipe, PipeTransform, inject } from '@angular/core';

import { LanguageService } from '../../application/language.service';

type DateFormat = 'date' | 'short' | 'datetime' | 'time';

const OPTIONS: Record<DateFormat, Intl.DateTimeFormatOptions> = {
  date: { day: 'numeric', month: 'short', year: 'numeric' },
  short: { day: 'numeric', month: 'short' },
  datetime: { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
  time: { hour: '2-digit', minute: '2-digit' },
};

@Pipe({ name: 'localizedDate', pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(value: string | null | undefined, format: DateFormat = 'date'): string {
    if (!value) return '—';
    const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
    const locale = this.language.current() === 'es' ? 'es-PE' : 'en-US';
    return new Intl.DateTimeFormat(locale, OPTIONS[format]).format(date);
  }
}

@Pipe({ name: 'hours', pure: false })
export class HoursPipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(hours: number | null | undefined): string {
    if (hours === null || hours === undefined || Number.isNaN(hours)) return '—';
    const locale = this.language.current() === 'es' ? 'es-PE' : 'en-US';
    const digits = hours < 10 ? 1 : 0;
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(hours)} h`;
  }
}
