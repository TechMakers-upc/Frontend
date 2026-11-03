import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';

import { TranslatePipe } from '@ngx-translate/core';

import { AuthTokenStorage } from '../../../../shared/infrastructure/auth-token.storage';
import { AnalyticsApi } from '../../../infrastructure/analytics-api';
import type { TechnicianPerformance as TechnicianMetrics } from '../../../domain/model/maintenance-metrics';

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
private readonly api = inject(AnalyticsApi);
private readonly tokenStorage = inject(AuthTokenStorage);
private readonly remote = signal<Record<string, TechnicianMetrics>>({});
protected readonly loading = signal(false);
protected readonly failed = signal(false);

  private readonly analytics = inject(MaintenanceAnalytics);
  private readonly directory = inject(UserDirectoryStore);
  protected readonly plantStore = inject(PlantStore);

  protected readonly range = signal<Range>('30');

  private readonly period = computed<Period>(() => {
    const range = this.range();
    return range === 'all' ? { from: null, to: null } : { from: addDays(todayDate(), -Number(range)), to: null };
  });

private readonly fetchPerformance = effect((onCleanup) => {
  const technicians = this.directory.techniciansInScope();
  const period = this.period();
  if (!this.tokenStorage.read()) {
    this.loading.set(false);
    return;
  }

  this.remote.set({});
  this.failed.set(false);

  let pending = technicians.length;
  this.loading.set(pending > 0);

  const settled = () => {
    pending -= 1;
    if (pending === 0) this.loading.set(false);
  };

  const requests = technicians.map((tech) =>
    this.api.getTechnicianPerformance(tech.id, period).subscribe({
      next: (stats) => {
        this.remote.update((rows) => ({ ...rows, [tech.id]: stats }));
        settled();
      },
      error: () => {
        this.failed.set(true);
        settled();
      },
    }),
  );
  onCleanup(() => requests.forEach((request) => request.unsubscribe()));
});

  protected readonly rows = computed(() =>
    this.directory
      .techniciansInScope()
      .map((tech) => ({ tech, stats: this.tokenStorage.read()
        ? (this.remote()[tech.id] ?? {
            technicianId: tech.id, assigned: 0, inProgress: 0, completed: 0,
            overdue: 0, avgRepairHours: null, lastActivity: null,
          })
        : this.analytics.technicianPerformance(tech.id, this.period()) }))

      .sort((a, b) => b.stats.completed - a.stats.completed),
  );
}
