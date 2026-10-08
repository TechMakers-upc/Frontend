import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export const LANGUAGES = ['es', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

const STORAGE_KEY = 'fixcore.language';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  private readonly currentSignal = signal<Language>('es');
  readonly current = this.currentSignal.asReadonly();

  init(): void {
    this.use(this.storedLanguage() ?? this.browserLanguage());
  }

  use(language: Language): void {
    this.currentSignal.set(language);
    this.translate.use(language);
    this.document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
    }
  }

  private storedLanguage(): Language | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return LANGUAGES.find((language) => language === value) ?? null;
    } catch {
      return null;
    }
  }

  private browserLanguage(): Language {
    return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
  }
}
