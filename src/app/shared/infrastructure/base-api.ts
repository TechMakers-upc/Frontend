import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AggregateRoot } from '../domain/model/entity';


export abstract class BaseApi<TEntity extends AggregateRoot, TResource extends object> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly endpointPath: string;

  protected abstract toEntity(resource: TResource): TEntity;

  protected toResource(entity: TEntity): TResource {
    return { ...entity } as unknown as TResource;
  }

  protected get url(): string {
    return `${environment.apiBaseUrl}${this.endpointPath}`;
  }

  getAll(): Observable<TEntity[]> {
    return this.http.get<TResource[]>(this.url).pipe(map((items) => items.map((item) => this.toEntity(item))));
  }

  create(entity: TEntity): Observable<TEntity> {
    return this.http.post<TResource>(this.url, this.toResource(entity)).pipe(map((item) => this.toEntity(item)));
  }

  update(entity: TEntity): Observable<TEntity> {
    return this.http
      .put<TResource>(`${this.url}/${entity.id}`, this.toResource(entity))
      .pipe(map((item) => this.toEntity(item)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
