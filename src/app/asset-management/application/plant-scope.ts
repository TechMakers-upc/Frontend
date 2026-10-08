import { Injectable, computed, inject, signal } from '@angular/core';

import { SessionStore } from '../../shared/application/session.store';
import { PlantStore } from './plant.store';

const STORAGE_KEY = 'fixcore.selected-plant';


@Injectable({ providedIn: 'root' })
export class PlantScope {
  private readonly session = inject(SessionStore);
  private readonly plantStore = inject(PlantStore);

  private readonly selectedSignal = signal<string | null>(this.readSelection());

  readonly canSwitch = computed(() => this.session.currentAccount()?.role === 'operations-manager');
  readonly selectedPlantId = computed(() => (this.canSwitch() ? this.selectedSignal() : null));

  readonly plantIds = computed<string[]>(() => {
    const account = this.session.currentAccount();
    if (!account) return [];
    if (!this.canSwitch()) return account.plantId ? [account.plantId] : [];
    const selected = this.selectedSignal();
    return selected ? [selected] : this.plantStore.items().map((plant) => plant.id);
  });

  readonly currentPlantId = computed(() => (this.plantIds().length === 1 ? this.plantIds()[0]! : null));

  private readonly plantIdSet = computed(() => new Set(this.plantIds()));

  includes(plantId: string): boolean {
    return this.plantIdSet().has(plantId);
  }

  select(plantId: string | null): void {
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
