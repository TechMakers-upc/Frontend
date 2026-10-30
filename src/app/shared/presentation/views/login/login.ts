import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthenticationApi } from '../../../infrastructure/authentication-api';
import { SessionStore } from '../../../application/session.store';
import { UserAccount } from '../../../domain/model/user-account.entity';
import { isRole } from '../../../domain/model/role';
import { AuthTokenStorage } from '../../../infrastructure/auth-token.storage';
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
  private readonly authenticationApi = inject(AuthenticationApi);
  private readonly tokenStorage = inject(AuthTokenStorage);
  private readonly sessionStore = inject(SessionStore);

  protected readonly showPassword = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly authenticationError = signal<string | null>(null);
  protected readonly authenticationSuccess = signal(false);

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

  protected submit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSubmitting()) return;

    this.authenticationError.set(null);
    this.authenticationSuccess.set(false);
    this.isSubmitting.set(true);

    const credentials = this.form.getRawValue();

    this.authenticationApi.signIn(credentials).subscribe({
      next: (response) => {
        if (!response.token) {
          this.authenticationError.set('El servidor no devolvió un token válido.');
        } else {
          const role = response.account.role.toLowerCase().replaceAll('_', '-');

          if (!isRole(role)) {
            this.authenticationError.set('El usuario tiene un rol no reconocido.');
          } else {
            const account = new UserAccount(
              String(response.account.id),
              response.account.fullName,
              response.account.email,
              role,
              response.account.plantId === null ? null : String(response.account.plantId),
              response.account.jobTitle,
            );

            this.tokenStorage.write(response.token);
            this.sessionStore.signIn(account);
            this.authenticationSuccess.set(true);
            this.form.controls.password.reset();
          }
        }
        this.isSubmitting.set(false);
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            this.authenticationError.set('Correo o contraseña incorrectos.');
          } else if (error.status === 0) {
            this.authenticationError.set('No se pudo conectar con el servidor.');
          } else {
            this.authenticationError.set('No se pudo iniciar sesión. Inténtalo nuevamente.');
          }
        } else {
          this.authenticationError.set('Ocurrió un error inesperado.');
        }
        this.isSubmitting.set(false);
      },
    });
  }
}
