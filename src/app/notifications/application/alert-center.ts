import { Injectable, computed, inject, signal } from '@angular/core';
import { AlertsApi } from '../infrastructure/alerts-api';
import { Alert } from '../domain/model/alert';

@Injectable({ providedIn: 'root' })
export class AlertCenter {
  private readonly alertsApi = inject(AlertsApi);
  private readonly remote = signal<Alert[]>([]);
  private readonly remoteUnread = signal<number | null>(null);

  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly isRemote = computed(() => true);
  readonly alerts = this.remote.asReadonly();

  readonly unseenCount = computed(
    () => this.remoteUnread() ??
      this.remote().filter((alert) => !alert.read).length,
  );

  constructor() {
    this.refreshUnreadCount();
  }

  refreshUnreadCount(): void {
    this.alertsApi.getUnreadCount().subscribe({
      next: (result) => this.remoteUnread.set(result.unread),
      error: () => this.remoteUnread.set(null),
    });
  }

  refresh(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.loadError.set(false);

    this.alertsApi.getAll().subscribe({
      next: (items) => {
        this.remote.set(items);
        this.remoteUnread.set(items.filter((alert) => !alert.read).length);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  markSeen(id: string): void {
    const alert = this.remote().find((item) => item.id === id);
    if (!alert || alert.read) return;

    this.alertsApi.markRead(id).subscribe({
      next: () => {
        this.remote.update((items) =>
          items.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          ),
        );
        this.remoteUnread.update((count) =>
          count === null ? null : Math.max(0, count - 1),
        );
      },
      error: () => this.loadError.set(true),
    });
  }

  isSeen(id: string): boolean {
    return !!this.remote().find((alert) => alert.id === id)?.read;
  }

  markAllSeen(): void {
    for (const alert of this.remote()) {
      if (!alert.read) this.markSeen(alert.id);
    }
  }
}