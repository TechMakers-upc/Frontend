import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { MaintenanceAnalytics } from '../../../../analytics/application/maintenance-analytics';
import { Icon } from '../../../../shared/presentation/components/icon/icon';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { HoursPipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { PlantStore } from '../../../application/plant.store';

@Component({
  selector: 'app-plant-list',
  imports: [RouterLink, TranslatePipe, Icon, PageHeader, StatusBadge, HoursPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plant-list.html',
  styleUrl: './plant-list.css',
})
export class PlantList {
  private readonly plantStore = inject(PlantStore);
  private readonly analytics = inject(MaintenanceAnalytics);

  protected readonly rows = computed(() =>
    this.plantStore.plants().map((plant) => ({ plant, summary: this.analytics.summarize([plant.id]) })),
  );
}
