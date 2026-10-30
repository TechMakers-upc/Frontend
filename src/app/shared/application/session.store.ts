import { Injectable, computed, inject, signal } from '@angular/core';
import { Role, isRole } from '../domain/model/role';
import { UserAccount } from '../domain/model/user-account.entity';
import { AuthTokenStorage } from '../infrastructure/auth-token.storage';
import { SessionStorage } from '../infrastructure/session-storage';

const DEMO_ROLE_KEY = 'fixcore.demo-role';

// Identificadores de demostración correspondientes al conjunto de datos ficticio.
// No se comprueban contraseñas ni se autentica al usuario en Sprint 2.
const DEMO_ACCOUNTS: Record<Role, { id: string; name: string; title: string; plantId: string | null }> = {
  'plant-manager': { id: 'u1', name: 'Jefe de planta', title: 'Jefe de planta', plantId: 'p1' },
  'operations-manager': { id: 'u2', name: 'Gerente de operaciones', title: 'Gerente de operaciones', plantId: null },
  technician: { id: 'u3', name: 'Técnico de mantenimiento', title: 'Técnico de mantenimiento', plantId: 'p1' },
};

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly tokenStorage = inject(AuthTokenStorage);
  private readonly sessionStorage = inject(SessionStorage);
  private readonly accountSignal = signal<UserAccount | null>(this.restoreAccount());

  readonly currentAccount = this.accountSignal.asReadonly();
  readonly isSignedIn = computed(() => this.accountSignal() !== null);
  readonly role = computed(() => this.accountSignal()?.role ?? null);

  signIn(account: UserAccount): void {
    this.tokenStorage.read();
    this.sessionStorage.write(account, false);
    this.accountSignal.set(account);
    try {
      sessionStorage.removeItem(DEMO_ROLE_KEY);
    } catch {
      // Browser storage may be unavailable.
    }
  }

  private restoreAccount(): UserAccount | null {
    if (this.tokenStorage.read()) {
      const account = this.sessionStorage.readAuthenticated();
      if (account) return account;
    }

    this.tokenStorage.clear();
    this.sessionStorage.clear();
    return this.restoreDemoAccount();
  }
  selectDemoRole(role: Role): void {
    this.tokenStorage.clear();
    this.sessionStorage.clear();
    this.accountSignal.set(this.demoAccount(role));
    try {
      sessionStorage.setItem(DEMO_ROLE_KEY, role);
    } catch {
      // La demo funciona aunque el navegador bloquee el almacenamiento.
    }
  }

  signOut(): void {
    this.accountSignal.set(null);
    this.tokenStorage.clear();
    this.sessionStorage.clear();
    try {
      sessionStorage.removeItem(DEMO_ROLE_KEY);
    } catch {
      // No requiere autenticación ni almacenamiento persistente.
    }
  }

  private demoAccount(role: Role): UserAccount {
    const account = DEMO_ACCOUNTS[role];
    return new UserAccount(account.id, account.name, '', role, account.plantId, account.title);
  }

  private restoreDemoAccount(): UserAccount | null {
    try {
      const value = sessionStorage.getItem(DEMO_ROLE_KEY);
      return isRole(value) ? this.demoAccount(value) : null;
    } catch {
      return null;
    }
  }
}
