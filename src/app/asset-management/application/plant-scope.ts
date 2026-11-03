import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { SessionStore } from '../../shared/application/session.store';
import { PlantStore } from './plant.store';

const STORAGE_KEY = 'fixcore.selected-plant';


@Injectable({ providedIn: 'root' })
export class PlantScope {
  private readonly session = inject(SessionStore);
  private readonly plantStore = inject(PlantStore);

  private readonly selectedSignal = signal<string | null>(this.readSelection());
  private previousAccountId = this.session.currentAccount()?.id ?? null;

  readonly canSwitch = computed(() => this.session.currentAccount()?.role === 'operations-manager');
  readonly selectedPlantId = computed(() => (this.canSwitch() ? this.selectedSignal() : null));

  readonly plantIds = computed<string[]>(() => {
    const account = this.session.currentAccount();
    if (!account) return [];
    if (!this.canSwitch()) return account.plantId ? [account.plantId] : [];
    const selected = this.selectedSignal();
    const available = this.plantStore.items().map((plant) => plant.id);
    return selected && available.includes(selected) ? [selected] : available;
  });

  readonly currentPlantId = computed(() => (this.plantIds().length === 1 ? this.plantIds()[0]! : null));

  private readonly plantIdSet = computed(() => new Set(this.plantIds()));

  constructor() {
    effect(() => {
      const accountId = this.session.currentAccount()?.id ?? null;
      if (accountId === this.previousAccountId) return;

      this.previousAccountId = accountId;
      this.selectedSignal.set(null);

      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
      }
    });
  }

  includes(plantId: string): boolean {
    return this.plantIdSet().has(plantId);
  }

  select(plantId: string | null): void {
    if (!this.canSwitch()) return;
    if (plantId && !this.plantStore.items().some((plant) => plant.id === plantId)) return;
    this.selectedSignal.set(plantId);
    try {
      if (plantId) localStorage.setItem(STORAGE_KEY, plantId);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
  }

  private readSelection(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
}
