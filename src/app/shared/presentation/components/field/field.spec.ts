import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';

import { Field, FieldInput } from './field';

@Component({
  selector: 'app-field-test-host',
  imports: [Field, FieldInput, ReactiveFormsModule],
  template: `<app-field for="sample" label="Sample"><input id="sample" appFieldInput [formControl]="name" /></app-field>`,
})
class FieldTestHost {
  readonly name = new FormControl('', { nonNullable: true, validators: [Validators.required] });
}

describe('Field', () => {
  let fixture: ComponentFixture<FieldTestHost>;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldTestHost],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(FieldTestHost);
    fixture.detectChanges();
    root = fixture.nativeElement;
  });

  it('shows the validation message when a required field is touched', async () => {
    expect(root.querySelector('#sample-error')).toBeNull();
    fixture.componentInstance.name.markAsTouched();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('#sample-error')).not.toBeNull();
  });

  it('clears the error after the field receives a valid value', async () => {
    fixture.componentInstance.name.markAsTouched();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('#sample-error')).not.toBeNull();

    fixture.componentInstance.name.setValue('Planta Central');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(root.querySelector('#sample-error')).toBeNull();
  });
});
