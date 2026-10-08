import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageService } from './shared/application/language.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly language = inject(LanguageService);
  protected readonly title = signal('fixcore-frontend');

  constructor() {
    this.language.init();
  }
}
