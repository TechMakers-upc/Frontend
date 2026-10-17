import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { SessionStore } from '../../../../shared/application/session.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { AssetStore } from '../../../application/asset.store';
import { AssetForm } from './asset-form';

describe('AssetForm', () => {
  let fixture: ComponentFixture<AssetForm>;
  let root: HTMLElement;
  let registerCount: number;

  beforeEach(async () => {
    registerCount = 0;
    await TestBed.configureTestingModule({
      imports: [AssetForm],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: SessionStore, useValue: { currentAccount: signal({ plantId: 'p1' }) } },
        { provide: ToastService, useValue: { success: () => {}, error: () => {} } },
        {
          provide: AssetStore,
          useValue: {
            state: signal('ready'),
            find: () => undefined,
            register: async () => { registerCount++; return { id: 'a-new', name: 'Test' }; },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AssetForm);
    fixture.detectChanges();
    root = fixture.nativeElement;
  });

  it('shows validation errors without registering an incomplete machine', async () => {
    for (const selector of ['#asset-code', '#asset-name', '#asset-location']) {
      root.querySelector<HTMLInputElement>(selector)!.dispatchEvent(new Event('blur', { bubbles: true }));
    }
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('#asset-code-error')).not.toBeNull();
    expect(root.querySelector('#asset-name-error')).not.toBeNull();
    expect(root.querySelector('#asset-location-error')).not.toBeNull();

    root.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(registerCount).toBe(0);
  });

  it('does not permit saving an unknown machine while editing', () => {
    fixture.componentRef.setInput('id', 'not-loaded');
    fixture.detectChanges();
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(registerCount).toBe(0);
  });
});
