import { Injectable, computed, signal } from '@angular/core';
import { Role, isRole } from '../domain/model/role';
import { UserAccount } from '../domain/model/user-account.entity';

const DEMO_ROLE_KEY = 'fixcore.demo-role';

const DEMO_ACCOUNTS: Record<Role, { name: string; title: string }> = {
  'plant-manager': { name: 'Jefe de planta', title: 'Jefe de planta' },
  'operations-manager': { name: 'Gerente de operaciones', title: 'Gerente de operaciones' },
  technician: { name: 'Técnico de mantenimiento', title: 'Técnico de mantenimiento' },
};

@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly accountSignal = signal<UserAccount | null>(this.restoreDemoAccount());

  readonly currentAccount = this.accountSignal.asReadonly();
  readonly isSignedIn = computed(() => this.accountSignal() !== null);
  readonly role = computed(() => this.accountSignal()?.role ?? null);

  selectDemoRole(role: Role): void {
    this.accountSignal.set(this.demoAccount(role));
    try {
      sessionStorage.setItem(DEMO_ROLE_KEY, role);
    } catch {
      // La demo funciona aunque el navegador bloquee el almacenamiento.
    }
  }

  signOut(): void {
    this.accountSignal.set(null);
    try {
      sessionStorage.removeItem(DEMO_ROLE_KEY);
    } catch {
      // No requiere autenticación ni almacenamiento persistente.
    }
  }

  private demoAccount(role: Role): UserAccount {
    const account = DEMO_ACCOUNTS[role];
    return new UserAccount(`demo-${role}`, account.name, '', role, null, account.title);
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
