import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { Login } from './login';

describe('Login', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();
  });

  it('shows the fields and keeps authentication unavailable', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector<HTMLInputElement>('#login-email')).not.toBeNull();
    expect(root.querySelector<HTMLInputElement>('#login-password')?.type).toBe('password');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(root.querySelector<HTMLAnchorElement>('a.login-demo-link')?.getAttribute('href')).toBe('/start');
  });

  it('toggles password visibility without submitting credentials', () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    const root: HTMLElement = fixture.nativeElement;
    const toggle = root.querySelector<HTMLButtonElement>('button[aria-controls="login-password"]');
    toggle?.click();
    fixture.detectChanges();
    expect(root.querySelector<HTMLInputElement>('#login-password')?.type).toBe('text');
  });
});
