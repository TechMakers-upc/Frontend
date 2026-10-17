import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { Login } from './login';

describe('Login', () => {
  let fixture: ComponentFixture<Login>;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    root = fixture.nativeElement;
  });

  function setField(selector: string, value: string): HTMLInputElement {
    const input = root.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    fixture.detectChanges();
    return input;
  }

  it('shows the form without enabling authentication', () => {
    expect(root.querySelector<HTMLInputElement>('#login-email')).not.toBeNull();
    expect(root.querySelector<HTMLInputElement>('#login-password')?.type).toBe('password');
    expect(root.querySelector<HTMLButtonElement>('.login-submit')?.disabled).toBe(true);
    expect(root.querySelector<HTMLAnchorElement>('a.login-demo-link')?.getAttribute('href')).toBe('/start');
  });

  it('shows required errors after both fields lose focus', () => {
    setField('#login-email', '');
    setField('#login-password', '');
    expect(root.querySelector('#login-email-error')).not.toBeNull();
    expect(root.querySelector('#login-password-error')).not.toBeNull();
    expect(root.querySelector<HTMLInputElement>('#login-email')?.getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector<HTMLInputElement>('#login-password')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('rejects malformed emails and short passwords', () => {
    setField('#login-email', 'invalid-email');
    setField('#login-password', '1234567');
    expect(root.querySelector('#login-email-error')).not.toBeNull();
    expect(root.querySelector('#login-password-error')).not.toBeNull();
  });

  it('clears errors after entering valid values without authenticating', () => {
    setField('#login-email', 'worker@example.com');
    setField('#login-password', 'valid-password-123');
    expect(root.querySelector('#login-email-error')).toBeNull();
    expect(root.querySelector('#login-password-error')).toBeNull();
    expect(root.querySelector<HTMLButtonElement>('.login-submit')?.disabled).toBe(true);
  });

  it('toggles password visibility', () => {
    root.querySelector<HTMLButtonElement>('button[aria-controls="login-password"]')!.click();
    fixture.detectChanges();
    expect(root.querySelector<HTMLInputElement>('#login-password')?.type).toBe('text');
  });
});
