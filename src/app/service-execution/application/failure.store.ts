import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { PlantScope } from '../../asset-management/application/plant-scope';
import { CollectionStore } from '../../shared/application/collection.store';
import { Priority, priorityRank } from '../domain/model/priority';
import { Failure } from '../domain/model/failure.entity';
import { FailuresApi } from '../infrastructure/failures-api';

@Injectable({ providedIn: 'root' })
export class FailureStore extends CollectionStore<Failure> {
  protected readonly api = inject(FailuresApi);
  private readonly scope = inject(PlantScope);

  readonly inScope = computed(() =>
    this.items()
      .filter((failure) => this.scope.includes(failure.plantId))
      .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt)),
  );

  /** Unresolved failures, most urgent first. */
  readonly pending = computed(() =>
    this.inScope()
      .filter((failure) => !failure.isResolved)
      .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.reportedAt.localeCompare(b.reportedAt)),
  );

  async resolveFailure(id: string): Promise<Failure> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown failure ${id}`);
    }

    if (current.isResolved) {
      return current;
    }

    const saved = await firstValueFrom(
      this.api.resolveFailure(current),
    );

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

  async setPriority(id: string, priority: Priority): Promise<Failure> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown failure ${id}`);
    }

    const saved = await firstValueFrom(
      this.api.prioritize(current, priority),
    );

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

  openFor(assetId: string): Failure[] {
    return this.items().filter((failure) => failure.assetId === assetId && !failure.isResolved);
  }
}
