import { Injectable, computed, inject } from '@angular/core';

import { PlantScope } from '../../asset-management/application/plant-scope';
import { CollectionStore } from '../../shared/application/collection.store';
import { priorityRank } from '../domain/model/priority';
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

  openFor(assetId: string): Failure[] {
    return this.items().filter((failure) => failure.assetId === assetId && !failure.isResolved);
  }
}
