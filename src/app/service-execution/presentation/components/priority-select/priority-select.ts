import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ToastService } from '../../../../shared/application/toast.service';
import { SessionStore } from '../../../../shared/application/session.store';
import { FailureStore } from '../../../application/failure.store';
import { Failure } from '../../../domain/model/failure.entity';
import { PRIORITIES, Priority } from '../../../domain/model/priority';

/** US20: the plant manager sets how urgent a failure is, saved on change. */
@Component({
  selector: 'app-priority-select',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './priority-select.html',
  styleUrl: './priority-select.css',
})
export class PrioritySelect {
  private readonly failureStore = inject(FailureStore);
  protected readonly role = inject(SessionStore).role;
  private readonly toast = inject(ToastService);
  private readonly translate = inject(TranslateService);

  readonly failure = input.required<Failure>();

  protected readonly priorities = PRIORITIES;
  protected readonly saving = signal(false);

  protected async change(event: Event): Promise<void> {
    if (this.saving() || this.role() !== 'plant-manager') return;
    const priority = (event.target as HTMLSelectElement).value as Priority;
    this.saving.set(true);
    try {
      await this.failureStore.setPriority(this.failure().id, priority);
      this.toast.success(this.translate.instant('failures.prioritized', { priority: this.translate.instant(`priority.${priority}`) }));
    } catch {
      this.toast.error(this.translate.instant('common.saveError'));
    } finally {
      this.saving.set(false);
    }
  }
}
