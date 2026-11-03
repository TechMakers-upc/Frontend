import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { PlantScope } from '../../asset-management/application/plant-scope';
import { UserAccount } from '../domain/model/user-account.entity';
import { UserAccountAssembler } from '../infrastructure/user-account.assembler';
import { UsersApi } from '../infrastructure/users-api';
import { LoadState } from './collection.store';
import { SessionStore } from './session.store';

@Injectable({ providedIn: 'root' })
export class UserDirectoryStore {
  private readonly api = inject(UsersApi);
  private readonly scope = inject(PlantScope);
  private readonly session = inject(SessionStore);
  private previousAccountId = this.session.currentAccount()?.id ?? null;
  private generation = 0;

  private readonly accountsSignal = signal<UserAccount[]>([]);
  private readonly stateSignal = signal<LoadState>('idle');

  readonly accounts = this.accountsSignal.asReadonly();
  readonly state = this.stateSignal.asReadonly();
  readonly byId = computed(() => new Map(this.accountsSignal().map((account) => [account.id, account])));

  readonly techniciansInScope = computed(() =>
    this.accountsSignal()
      .filter((account) => account.role === 'technician' && account.plantId && this.scope.includes(account.plantId))
      .sort((a, b) => a.fullName.localeCompare(b.fullName)),
  );

  constructor() {
    effect(() => {
      const accountId = this.session.currentAccount()?.id ?? null;
      if (accountId === this.previousAccountId) return;

      this.previousAccountId = accountId;
      this.generation += 1;
      this.accountsSignal.set([]);
      this.stateSignal.set('idle');
    });
  }

  load(force = false): void {
    const state = this.stateSignal();
    if (state === 'loading' || (state === 'ready' && !force)) return;
    this.stateSignal.set('loading');
    this.api.getAll().subscribe({
      next: (resources) => {
        const accounts = resources.map(UserAccountAssembler.toEntity).filter((a): a is UserAccount => a !== null);
        this.accountsSignal.set(accounts);
        this.stateSignal.set('ready');
      },
      error: () => this.stateSignal.set('error'),
    });
  }

  find(id: string | null | undefined): UserAccount | undefined {
    return id ? this.byId().get(id) : undefined;
  }
}
