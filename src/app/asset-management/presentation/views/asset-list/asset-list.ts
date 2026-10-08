import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { SessionStore } from '../../../../shared/application/session.store';
import { PlantTimeline } from '../../../../analytics/application/plant-timeline';
import { LanguageService } from '../../../../shared/application/language.service';
import { DayStrip } from '../../../../shared/presentation/components/day-strip/day-strip';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { AssetStore } from '../../../application/asset.store';
import { PlantScope } from '../../../application/plant-scope';
import { PlantStore } from '../../../application/plant.store';
import { ASSET_STATUSES, AssetStatus, CRITICALITIES, Criticality } from '../../../domain/model/asset.entity';

const STATUS_RANK: Record<AssetStatus, number> = { down: 0, maintenance: 1, operational: 2 };
import { ASSET_STATUS_TONE, CRITICALITY_TONE } from '../../asset-presentation';

@Component({
  selector: 'app-asset-list',
  imports: [RouterLink, TranslatePipe, DayStrip, Icon, PageHeader],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './asset-list.html',
  styleUrl: './asset-list.css',
})
export class AssetList {
  private readonly router = inject(Router);
  protected readonly assetStore = inject(AssetStore);
  protected readonly plantStore = inject(PlantStore);
  protected readonly scope = inject(PlantScope);
  private readonly session = inject(SessionStore);
  private readonly timeline = inject(PlantTimeline);
  private readonly language = inject(LanguageService);
  protected readonly canManage = computed(() => this.session.currentAccount()?.role === 'plant-manager');
  protected readonly canPrintLabels = computed(() => this.session.currentAccount()?.role !== 'technician');

  readonly status = input<AssetStatus | undefined>();

  protected readonly statuses = ASSET_STATUSES;
  protected readonly criticalities = CRITICALITIES;
  protected readonly statusTone = ASSET_STATUS_TONE;
  protected readonly criticalityTone = CRITICALITY_TONE;

  protected readonly query = signal('');
  protected readonly criticality = signal<Criticality | ''>('');

  protected readonly counts = computed(() => {
    const counts: Record<AssetStatus, number> = { operational: 0, maintenance: 0, down: 0 };
    for (const asset of this.assetStore.inScope()) counts[asset.status]++;
    return counts;
  });

  protected readonly visible = computed(() => {
    const text = this.query().trim().toLowerCase();
    const status = this.status();
    const criticality = this.criticality();
    return this.assetStore.inScope().filter(
      (asset) =>
        (!status || asset.status === status) &&
        (!criticality || asset.criticality === criticality) &&
        (!text || `${asset.code} ${asset.name} ${asset.location}`.toLowerCase().includes(text)),
    );
  });

  protected readonly rows = computed(() =>
    [...this.visible()]
      .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.code.localeCompare(b.code))
      .map((asset) => ({ asset, cells: this.timeline.forAsset(asset) })),
  );

  protected readonly dayHeads = computed(() => {
    const locale = this.language.current() === 'es' ? 'es-PE' : 'en-US';
    const format = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    return this.timeline.days().map((date) => ({ date, letter: format.format(new Date(`${date}T00:00:00`)) }));
  });

  protected readonly showPlant = computed(() => this.scope.plantIds().length > 1);

  protected filterStatus(status: AssetStatus | null): void {
    void this.router.navigate([], { queryParams: { status }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onCriticality(event: Event): void {
    this.criticality.set((event.target as HTMLSelectElement).value as Criticality | '');
  }
}
