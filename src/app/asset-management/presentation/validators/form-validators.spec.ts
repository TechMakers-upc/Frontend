import { FormControl } from '@angular/forms';
import { todayDate } from '../../../shared/domain/model/date-time';

import { installationDateValidator, machineCodeValidator, nonBlankValidator } from './form-validators';

describe('Asset management form validators', () => {
  it('rejects empty and whitespace-only required values', () => {
    expect(nonBlankValidator(new FormControl(''))).toEqual({ required: true });
    expect(nonBlankValidator(new FormControl('   '))).toEqual({ required: true });
    expect(nonBlankValidator(new FormControl(' Planta Lima '))).toBeNull();
  });

  it('accepts machine codes with letters, numbers and separators', () => {
    expect(machineCodeValidator(new FormControl('CMP-01'))).toBeNull();
    expect(machineCodeValidator(new FormControl('BOMBA_2'))).toBeNull();
    expect(machineCodeValidator(new FormControl('cmp-02'))).toBeNull();
  });

  it('rejects unsupported machine code characters', () => {
    expect(machineCodeValidator(new FormControl('CMP 01'))).toEqual({ codeFormat: true });
    expect(machineCodeValidator(new FormControl('CMP/01'))).toEqual({ codeFormat: true });
  });

  it('accepts past or current installation dates', () => {
    expect(installationDateValidator(new FormControl('2020-01-01'))).toBeNull();
    expect(installationDateValidator(new FormControl(todayDate()))).toBeNull();
  });

  it('rejects future installation dates', () => {
    expect(installationDateValidator(new FormControl('2999-12-31'))).toEqual({ futureDate: true });
  });

  it('rejects impossible calendar dates', () => {
    expect(installationDateValidator(new FormControl('2026-02-30'))).toEqual({ invalidDate: true });
  });
});
