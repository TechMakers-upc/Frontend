import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { todayDate } from '../../../shared/domain/model/date-time';

export const nonBlankValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  return typeof value === 'string' && !value.trim() ? { required: true } : null;
};

export const machineCodeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '').trim();
  if (!value) return null;
  return /^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/.test(value) ? null : { codeFormat: true };
};

export const installationDateValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = String(control.value ?? '');
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return { invalidDate: true };
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime()) ||
      date.getFullYear() !== Number(value.slice(0, 4)) ||
      date.getMonth() + 1 !== Number(value.slice(5, 7)) ||
      date.getDate() !== Number(value.slice(8, 10))) {
    return { invalidDate: true };
  }
  return value > todayDate() ? { futureDate: true } : null;
};
