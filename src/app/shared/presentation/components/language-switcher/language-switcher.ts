import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { LANGUAGES, LanguageService } from '../../../application/language.service';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe, UpperCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
})
export class LanguageSwitcher {
  protected readonly languageService = inject(LanguageService);
  protected readonly languages = LANGUAGES;

  readonly tone = input<'light' | 'dark'>('light');
}
