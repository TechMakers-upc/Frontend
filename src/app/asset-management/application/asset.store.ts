import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CollectionStore } from '../../shared/application/collection.store';
import { nowIso } from '../../shared/domain/model/date-time';
import { Asset, AssetDetails } from '../domain/model/asset.entity';
import { AssetsApi } from '../infrastructure/assets-api';
import { PlantScope } from './plant-scope';

@Injectable({ providedIn: 'root' })
export class AssetStore extends CollectionStore<Asset> {
  protected readonly api = inject(AssetsApi);
  private readonly scope = inject(PlantScope);

  readonly inScope = computed(() =>
    this.items()
      .filter((asset) => this.scope.includes(asset.plantId))
      .sort((a, b) => a.code.localeCompare(b.code)),
  );

  async addManual(id: string, title: string, url: string): Promise<Asset> {
    const current = this.find(id);
    if (!current) throw new Error(`Unknown asset ${id}`);

    const saved = await firstValueFrom(this.api.addManual(current, title, url));

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

  async removeManual(id: string, index: number): Promise<Asset> {
    const current = this.find(id);
    if (!current) throw new Error(`Unknown asset ${id}`);

    const saved = await firstValueFrom(this.api.removeManual(current, index));

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

  async register(plantId: string, details: AssetDetails): Promise<Asset> {
    const asset = new Asset({
      id: crypto.randomUUID(),
      plantId,
      status: 'operational',
      statusChangedAt: nowIso(),
      manuals: [],
      ...details,
    });
    asset.updateDetails(details);
    return this.add(asset);
  }
}
