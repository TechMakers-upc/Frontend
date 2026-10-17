import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';

import { SessionStore } from '../../../application/session.store';
import { DemoAccess } from './demo-access';

describe('DemoAccess', () => {
  let fixture: ComponentFixture<DemoAccess>;
  let session: SessionStore;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemoAccess],
      providers: [provideRouter([]), provideTranslateService()],
    }).compileComponents();
    session = TestBed.inject(SessionStore);
    router = TestBed.inject(Router);
    session.signOut();
    fixture = TestBed.createComponent(DemoAccess);
    fixture.detectChanges();
  });

  afterEach(() => session.signOut());

  it('offers the three demo roles and a link to Login', () => {
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelectorAll('.demo-option').length).toBe(3);
    expect(root.querySelector<HTMLAnchorElement>('.demo-login-link')?.getAttribute('href')).toBe('/login');
    expect(root.querySelector('app-language-switcher')).not.toBeNull();
  });

  it('selects the plant manager and navigates to the dashboard', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const root: HTMLElement = fixture.nativeElement;
    root.querySelectorAll<HTMLButtonElement>('.demo-option')[0].click();
    expect(session.role()).toBe('plant-manager');
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('can switch from plant manager to technician in demo mode', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const options = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.demo-option');
    options[0].click();
    options[2].click();
    expect(session.role()).toBe('technician');
    expect(navigate).toHaveBeenLastCalledWith('/today');
  });
});
