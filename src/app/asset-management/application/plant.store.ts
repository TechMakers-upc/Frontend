import { Injectable, computed, inject } from '@angular/core';

import { CollectionStore } from '../../shared/application/collection.store';
import { Plant } from '../domain/model/plant.entity';
import { PlantsApi } from '../infrastructure/plants-api';

@Injectable({ providedIn: 'root' })
export class PlantStore extends CollectionStore<Plant> {
  protected readonly api = inject(PlantsApi);

  readonly plants = computed(() => [...this.items()].sort((a, b) => a.name.localeCompare(b.name)));

  findById(id: string | null): Plant | undefined {
    return this.find(id);
  }

  async register(details: { name: string; city: string; address: string }): Promise<Plant> {
    const plant = new Plant({ id: crypto.randomUUID(), name: '', city: '', address: '' });
    plant.updateDetails(details);
    return this.add(plant);
  }
}
