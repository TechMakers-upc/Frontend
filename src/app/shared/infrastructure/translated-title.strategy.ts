import { Injectable, inject, Injector } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly injector = inject(Injector);
  private translationService: TranslateService | null = null;
  private currentKey: string | undefined;
  private entity: string | null = null;

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.currentKey = this.buildTitle(snapshot);
    this.entity = null;
    this.apply();
  }

  setEntity(name: string | null): void {
    this.entity = name;
    this.apply();
  }

  private translate(): TranslateService {
    if (this.translationService) return this.translationService;
    const translate = this.injector.get(TranslateService);
    this.translationService = translate;
    translate.onLangChange.subscribe(() => this.apply());
    return translate;
  }

  private apply(): void {
    if (!this.currentKey) {
      this.title.setTitle('FixCore');
      return;
    }
    this.translate().get(this.currentKey).subscribe((page: string) => {
      this.title.setTitle(this.entity ? `${this.entity} · ${page} · FixCore` : `${page} · FixCore`);
    });
  }
}
