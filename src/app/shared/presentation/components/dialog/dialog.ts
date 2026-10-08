import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { Icon } from '../icon/icon';

@Component({
  selector: 'app-dialog',
  imports: [TranslatePipe, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class Dialog {
  private static nextId = 0;

  readonly heading = input.required<string>();
  readonly open = input(false);
  readonly closed = output<void>();

  protected readonly titleId = `dialog-title-${Dialog.nextId++}`;
  private readonly dialogRef = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialogRef().nativeElement;
      if (this.open() && !dialog.open) dialog.showModal();
      if (!this.open() && dialog.open) dialog.close();
    });
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialogRef().nativeElement) this.closed.emit();
  }
}
