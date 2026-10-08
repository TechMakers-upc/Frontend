import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { PlantScope } from '../../../../asset-management/application/plant-scope';
import { PlantStore } from '../../../../asset-management/application/plant.store';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { WorkOrderStore } from '../../../../service-execution/application/work-order.store';
import { LanguageService } from '../../../../shared/application/language.service';
import { todayDate } from '../../../../shared/domain/model/date-time';
import { BoardLegend } from '../../../../shared/presentation/components/board-legend/board-legend';
import { DayStrip } from '../../../../shared/presentation/components/day-strip/day-strip';
import { StatusBadge } from '../../../../shared/presentation/components/status-badge/status-badge';
import { HoursPipe, LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { MaintenanceAnalytics } from '../../../application/maintenance-analytics';
import { PlantTimeline } from '../../../application/plant-timeline';

/** Operations manager home: every plant as one row of the board, worst first. */
@Component({
  selector: 'app-operations-overview',
  imports: [RouterLink, TranslatePipe, BoardLegend, DayStrip, StatusBadge, HoursPipe, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './operations-overview.html',
  styleUrl: './operations-overview.css',
})
export class OperationsOverview {
  private readonly plantStore = inject(PlantStore);
  private readonly scope = inject(PlantScope);
  private readonly directory = inject(UserDirectoryStore);
  private readonly workOrderStore = inject(WorkOrderStore);
  private readonly analytics = inject(MaintenanceAnalytics);
  private readonly timeline = inject(PlantTimeline);
  private readonly language = inject(LanguageService);

  protected readonly today = todayDate();
  protected readonly summary = this.analytics.current;
  protected readonly strips = this.timeline.current;
  protected readonly loading = computed(() => this.plantStore.state() !== 'ready');
  protected readonly scopeName = computed(() => this.plantStore.find(this.scope.currentPlantId())?.displayName ?? null);

  protected readonly dayHeads = computed(() => {
    const locale = this.language.current() === 'es' ? 'es-PE' : 'en-US';
    const format = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    return this.timeline.days().map((date) => ({ date, letter: format.format(new Date(`${date}T00:00:00`)) }));
  });

  /** Plants with machines stopped first, then by availability. */
  protected readonly plants = computed(() =>
    this.plantStore
      .plants()
      .filter((plant) => this.scope.includes(plant.id))
      .map((plant) => ({
        plant,
        summary: this.analytics.summarize([plant.id]),
        cells: this.timeline.forPlants([plant.id]).availability,
      }))
      .sort((a, b) => b.summary.down - a.summary.down || (a.summary.availability ?? 100) - (b.summary.availability ?? 100)),
  );

  /** A technician is busy while one of their orders is in progress. */
  protected readonly technicians = computed(() =>
    this.directory
      .techniciansInScope()
      .map((tech) => {
        const active = this.workOrderStore.items().find((o) => o.technicianId === tech.id && o.status === 'in-progress');
        const pending = this.workOrderStore.items().filter((o) => o.technicianId === tech.id && o.status === 'pending').length;
        return { tech, active, pending, plant: this.plantStore.find(tech.plantId) };
      })
      .sort((a, b) => Number(!!a.active) - Number(!!b.active) || b.pending - a.pending),
  );

  protected readonly availableTechnicians = computed(() => this.technicians().filter((row) => !row.active).length);

  protected percent(value: number | null): string {
    return value === null ? '—' : `${value}`;
  }
}
