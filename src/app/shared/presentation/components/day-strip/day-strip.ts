import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { DayCell, DayState } from '../../../domain/model/day-state';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';

export type StripKind = 'asset' | 'availability' | 'failures' | 'orders' | 'stock';


@Component({
  selector: 'app-day-strip',
  imports: [TranslatePipe, LocalizedDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './day-strip.html',
  styleUrl: './day-strip.css',
})
export class DayStrip {
  readonly cells = input.required<DayCell[]>();
  readonly kind = input<StripKind>('asset');
  readonly label = input<string>('');
  readonly size = input<'md' | 'lg'>('md');

  protected readonly counts = computed(() => {
    const counts: Record<DayState, number> & { days: number } = { ok: 0, warn: 0, down: 0, conflict: 0, none: 0, days: 0 };
    for (const cell of this.cells()) counts[cell.state]++;
    counts.days = this.cells().length;
    counts.down += counts.conflict;
    return counts;
  });
}
