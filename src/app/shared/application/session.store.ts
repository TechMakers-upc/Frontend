import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { UserAccount } from '../domain/model/user-account.entity';
import { SessionStorage } from '../infrastructure/session-storage';
import { UserAccountAssembler } from '../infrastructure/user-account.assembler';
import { UserAccountResource } from '../infrastructure/user-account.resource';
import { UsersApi } from '../infrastructure/users-api';

export type SignInResult = { ok: true; account: UserAccount } | { ok: false; reason: 'invalid-credentials' | 'unreachable' };


@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly api = inject(UsersApi);
  private readonly sessionStorage = inject(SessionStorage);

  private readonly currentAccountSignal = signal<UserAccount | null>(this.sessionStorage.read());

  readonly currentAccount = this.currentAccountSignal.asReadonly();
  readonly isSignedIn = computed(() => this.currentAccountSignal() !== null);
  readonly role = computed(() => this.currentAccountSignal()?.role ?? null);

  async signIn(email: string, password: string, rememberMe: boolean): Promise<SignInResult> {
    let matches: UserAccountResource[];
    try {
      matches = await firstValueFrom(this.api.findByEmail(email.trim().toLowerCase()));
    } catch {
      return { ok: false, reason: 'unreachable' };
    }
    const record = matches.find((candidate) => candidate.password === password);
    const account = record ? UserAccountAssembler.toEntity(record) : null;
    if (!account) return { ok: false, reason: 'invalid-credentials' };

    this.sessionStorage.write(account, rememberMe);
    this.currentAccountSignal.set(account);
    return { ok: true, account };
  }

  signOut(): void {
    this.sessionStorage.clear();
    this.currentAccountSignal.set(null);
  }
}
