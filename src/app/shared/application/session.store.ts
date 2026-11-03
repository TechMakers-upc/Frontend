import { Injectable, computed, inject, signal } from '@angular/core';
import { UserAccount } from '../domain/model/user-account.entity';
import { AuthTokenStorage } from '../infrastructure/auth-token.storage';
import { SessionStorage } from '../infrastructure/session-storage';

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly tokenStorage = inject(AuthTokenStorage);
  private readonly sessionStorage = inject(SessionStorage);
  private readonly accountSignal = signal<UserAccount | null>(this.restoreAccount());

  readonly currentAccount = this.accountSignal.asReadonly();
  readonly isSignedIn = computed(() => this.accountSignal() !== null);
  readonly role = computed(() => this.accountSignal()?.role ?? null);

  signIn(account: UserAccount): void {
    this.sessionStorage.write(account, false);
    this.accountSignal.set(account);
  }

  private restoreAccount(): UserAccount | null {
    if (this.tokenStorage.read()) {
      const account = this.sessionStorage.readAuthenticated();
      if (account) return account;
    }

    this.tokenStorage.clear();
    this.sessionStorage.clear();
    return null;
  }

  signOut(): void {
    this.accountSignal.set(null);
    this.tokenStorage.clear();
    this.sessionStorage.clear();
  }
}