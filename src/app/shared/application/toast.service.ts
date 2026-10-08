import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  private readonly toastsSignal = signal<Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  success(message: string): void {
    this.push(message, 'success');
  }

  error(message: string): void {
    this.push(message, 'error');
  }

  dismiss(id: number): void {
    this.toastsSignal.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private push(message: string, tone: Toast['tone']): void {
    const id = this.nextId++;
    this.toastsSignal.update((toasts) => [...toasts.slice(-2), { id, message, tone }]);
    setTimeout(() => this.dismiss(id), tone === 'error' ? 7000 : 4000);
  }
}
