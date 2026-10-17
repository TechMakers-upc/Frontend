import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { SessionStore } from '../../../../shared/application/session.store';
import { ToastService } from '../../../../shared/application/toast.service';
import { PlantScope } from '../../../application/plant-scope';
import { PlantStore } from '../../../application/plant.store';
import { PlantForm } from './plant-form';

describe('PlantForm', () => {
  let fixture: ComponentFixture<PlantForm>;
  let root: HTMLElement;
  let registerCount: number;

  beforeEach(async () => {
    registerCount = 0;
    await TestBed.configureTestingModule({
      imports: [PlantForm],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: SessionStore, useValue: { role: signal('operations-manager') } },
        { provide: PlantScope, useValue: { currentPlantId: signal(null) } },
        { provide: ToastService, useValue: { success: () => {}, error: () => {} } },
        {
          provide: PlantStore,
          useValue: {
            state: signal('ready'),
            find: () => undefined,
            register: async () => { registerCount++; return { id: 'p-new', name: 'Test' }; },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PlantForm);
    fixture.detectChanges();
    root = fixture.nativeElement;
  });

  it('displays errors and never registers an empty plant', async () => {
    for (const selector of ['#plant-name', '#plant-city']) {
      root.querySelector<HTMLInputElement>(selector)!.dispatchEvent(new Event('blur', { bubbles: true }));
    }
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('#plant-name-error')).not.toBeNull();
    expect(root.querySelector('#plant-city-error')).not.toBeNull();

    root.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(registerCount).toBe(0);
  });

  it('does not allow saving an unknown plant while editing', () => {
    fixture.componentRef.setInput('id', 'not-loaded');
    fixture.detectChanges();
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
    expect(registerCount).toBe(0);
  });
});
