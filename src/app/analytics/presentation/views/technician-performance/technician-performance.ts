import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { PlantStore } from '../../../../asset-management/application/plant.store';
import { UserDirectoryStore } from '../../../../shared/application/user-directory.store';
import { addDays, todayDate } from '../../../../shared/domain/model/date-time';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { HoursPipe, LocalizedDatePipe } from '../../../../shared/presentation/pipes/localized-date.pipe';
import { MaintenanceAnalytics, Period } from '../../../application/maintenance-analytics';

type Range = '30' | '90' | 'all';

/** US46: what each technician has on their plate and how fast they close it. */
@Component({
  selector: 'app-technician-performance',
  imports: [TranslatePipe, PageHeader, HoursPipe, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './technician-performance.html',
  styleUrl: './technician-performance.css',
})
export class TechnicianPerformance {
  private readonly analytics = inject(MaintenanceAnalytics);
  private readonly directory = inject(UserDirectoryStore);
  protected readonly plantStore = inject(PlantStore);

  protected readonly range = signal<Range>('30');

  private readonly period = computed<Period>(() => {
    const range = this.range();
    return range === 'all' ? { from: null, to: null } : { from: addDays(todayDate(), -Number(range)), to: null };
  });

  protected readonly rows = computed(() =>
    this.directory
      .techniciansInScope()
      .map((tech) => ({ tech, stats: this.analytics.technicianPerformance(tech.id, this.period()) }))
      .sort((a, b) => b.stats.completed - a.stats.completed),
  );
}
