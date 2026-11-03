import { computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AggregateRoot } from '../domain/model/entity';
import { SessionStore } from './session.store';
import { BaseApi } from '../infrastructure/base-api';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

export abstract class CollectionStore<TEntity extends AggregateRoot> {
  protected abstract readonly api: BaseApi<TEntity, object>;
  private readonly sessionContext = inject(SessionStore);
  private previousAccountId = this.sessionContext.currentAccount()?.id ?? null;
  private generation = 0;

  protected readonly itemsSignal = signal<TEntity[]>([]);
  private readonly stateSignal = signal<LoadState>('idle');

  readonly items = this.itemsSignal.asReadonly();
  readonly state = this.stateSignal.asReadonly();
  readonly byId = computed(() => new Map(this.itemsSignal().map((item) => [item.id, item])));

  constructor() {
    effect(() => {
      const accountId = this.sessionContext.currentAccount()?.id ?? null;

      if (accountId === this.previousAccountId) return;

      this.previousAccountId = accountId;
      this.reset();
    });
  }

  protected reset(): void {
    this.generation += 1;
    this.itemsSignal.set([]);
    this.stateSignal.set('idle');
  }

  load(force = false): void {
    const state = this.stateSignal();
    if (state === 'loading' || (state === 'ready' && !force)) return;
    this.stateSignal.set('loading');
    const requestGeneration = ++this.generation;
    this.api.getAll().subscribe({
      next: (items) => {
        if (requestGeneration !== this.generation) return;
        this.itemsSignal.set(items);
        this.stateSignal.set('ready');
      },
      error: () => {
        if (requestGeneration === this.generation) this.stateSignal.set('error');
      },
    });
  }

  find(id: string | null | undefined): TEntity | undefined {
    return id ? this.byId().get(id) : undefined;
  }

  async add(entity: TEntity): Promise<TEntity> {
    const created = await firstValueFrom(this.api.create(entity));
    this.itemsSignal.update((items) => [...items, created]);
    return created;
  }

  async save(entity: TEntity): Promise<TEntity> {
    const saved = await firstValueFrom(this.api.update(entity));
    this.itemsSignal.update((items) => items.map((item) => (item.id === saved.id ? saved : item)));
    return saved;
  }

  async change(id: string, mutate: (draft: TEntity) => void): Promise<TEntity> {
    const current = this.find(id);
    if (!current) throw new Error(`Unknown id ${id}`);
    const draft = current.clone();
    mutate(draft);
    return this.save(draft);
  }
}
