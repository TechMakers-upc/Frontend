import { ChangeDetectionStrategy, Component, computed, inject, isDevMode, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ToastService } from '../../../../shared/application/toast.service';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { AssetQrLabels } from '../../../application/asset-qr-labels';
import { AssetStore } from '../../../application/asset.store';
import { PlantScope } from '../../../application/plant-scope';
import { PlantStore } from '../../../application/plant.store';
import { Asset } from '../../../domain/model/asset.entity';
import { ASSET_STATUS_TONE } from '../../asset-presentation';

@Component({
  selector: 'app-asset-labels',
  imports: [TranslatePipe, Icon, PageHeader, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './asset-labels.html',
  styleUrl: './asset-labels.css',
})
export class AssetLabels {
  protected readonly assetStore = inject(AssetStore);
  private readonly plantStore = inject(PlantStore);
  private readonly scope = inject(PlantScope);
  protected readonly labels = inject(AssetQrLabels);
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  protected readonly statusTone = ASSET_STATUS_TONE;
  protected readonly query = signal('');
  protected readonly showPlant = computed(() => this.scope.plantIds().length > 1);

  protected readonly showLocalhostNotice = isDevMode() && this.labels.pointsToLocalhost;

  protected readonly visible = computed(() => {
    const text = this.query().trim().toLowerCase();
    return this.assetStore
      .inScope()
      .filter((asset) => !text || `${asset.code} ${asset.name} ${asset.location}`.toLowerCase().includes(text));
  });

  protected plantName(asset: Asset): string {
    return this.plantStore.find(asset.plantId)?.displayName ?? '';
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected print(): void {
    window.print();
  }

  protected download(asset: Asset): void {
    void this.labels.download(asset);
  }

  protected async copyLink(asset: Asset): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.labels.reportLink(asset));
      this.toast.success(this.translate.instant('assets.qr.copied', { code: asset.code }));
    } catch {
      this.toast.error(this.translate.instant('assets.qr.copyError'));
    }
  }
}
