import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { ToastService } from '../../../application/toast.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-toast-host',
  imports: [TranslatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-host.html',
  styleUrl: './toast-host.css',
})
export class ToastHost {
  protected readonly toastService = inject(ToastService);
}
