import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { BrandMark } from '../../components/brand-mark/brand-mark';
import { LanguageSwitcher } from '../../components/language-switcher/language-switcher';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, BrandMark, LanguageSwitcher],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  protected readonly showPassword = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
  });

  protected emailErrorKey(): string | null {
    const control = this.form.controls.email;
    if (!control.dirty && !control.touched) return null;
    if (control.hasError('required')) return 'fields.errors.emailRequired';
    if (control.hasError('maxlength')) return 'fields.errors.maxLength';
    return control.hasError('email') ? 'fields.errors.emailInvalid' : null;
  }

  protected passwordErrorKey(): string | null {
    const control = this.form.controls.password;
    if (!control.dirty && !control.touched) return null;
    if (control.hasError('required')) return 'fields.errors.passwordRequired';
    if (control.hasError('maxlength')) return 'fields.errors.maxLength';
    return control.hasError('minlength') ? 'fields.errors.passwordLength' : null;
  }

  protected togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
  }

  protected preventPreviewSubmit(event: Event): void {
    event.preventDefault();
    this.form.markAllAsTouched();
  }
}
