import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);
  private currentKey: string | undefined;
  private entity: string | null = null;

  constructor() {
    super();
    this.translate.onLangChange.subscribe(() => this.apply());
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.currentKey = this.buildTitle(snapshot);
    this.entity = null;
    this.apply();
  }

  setEntity(name: string | null): void {
    this.entity = name;
    this.apply();
  }

  private apply(): void {
    if (!this.currentKey) {
      this.title.setTitle('FixCore');
      return;
    }
    this.translate.get(this.currentKey).subscribe((page: string) => {
      this.title.setTitle(this.entity ? `${this.entity} · ${page} · FixCore` : `${page} · FixCore`);
    });
  }
}
