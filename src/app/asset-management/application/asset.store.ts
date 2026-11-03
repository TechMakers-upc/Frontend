import { Injectable, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CollectionStore } from '../../shared/application/collection.store';
import { nowIso } from '../../shared/domain/model/date-time';
import { Asset, AssetDetails, AssetStatus } from '../domain/model/asset.entity';
import { AssetsApi } from '../infrastructure/assets-api';
import { PlantScope } from './plant-scope';

@Injectable({ providedIn: 'root' })
export class AssetStore extends CollectionStore<Asset> {
  protected readonly api = inject(AssetsApi);
  private readonly scope = inject(PlantScope);

  private assertAccessible(asset: Asset): void {
    if (!this.scope.includes(asset.plantId)) {
      throw new Error('Asset is outside the selected plant');
    }
  }

  readonly inScope = computed(() =>
    this.items()
      .filter((asset) => this.scope.includes(asset.plantId))
      .sort((a, b) => a.code.localeCompare(b.code)),
  );

  async setStatus(id: string, status: AssetStatus, at = nowIso()): Promise<Asset> {
    const current = this.find(id);

    if (!current) {
      throw new Error(`Unknown asset ${id}`);
    }

    this.assertAccessible(current);

    const saved = await firstValueFrom(
      this.api.changeStatus(current, status, at),
    );

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

  async addManual(id: string, title: string, url: string): Promise<Asset> {
    const current = this.find(id);
    if (!current) throw new Error(`Unknown asset ${id}`);
    this.assertAccessible(current);

    const saved = await firstValueFrom(this.api.addManual(current, title, url));

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

  async removeManual(id: string, index: number): Promise<Asset> {
    const current = this.find(id);
    if (!current) throw new Error(`Unknown asset ${id}`);
    this.assertAccessible(current);

    const saved = await firstValueFrom(this.api.removeManual(current, index));

    this.itemsSignal.update((items) =>
      items.map((item) => (item.id === saved.id ? saved : item)),
    );

    return saved;
  }

  async register(plantId: string, details: AssetDetails): Promise<Asset> {
    if (!this.scope.includes(plantId)) {
      throw new Error('Plant is not accessible');
    }

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
