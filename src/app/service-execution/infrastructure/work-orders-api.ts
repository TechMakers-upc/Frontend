import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { AuthTokenStorage } from '../../shared/infrastructure/auth-token.storage';
import { WorkOrder, WorkOrderProps } from '../domain/model/work-order.entity';
import { WorkOrderApiMapper } from './work-order-api.mapper';
import { WorkOrderApiResource } from './work-order-api.models';

@Injectable({ providedIn: 'root' })
export class WorkOrdersApi extends BaseApi<WorkOrder, WorkOrderProps> {
  protected readonly endpointPath = environment.workOrdersEndpointPath;

  private readonly tokenStorage = inject(AuthTokenStorage);

  protected toEntity(resource: WorkOrderProps): WorkOrder {
    return new WorkOrder({
      ...resource,
      workLog: resource.workLog ?? [],
      partsUsed: resource.partsUsed ?? [],
    });
  }

  override getAll(): Observable<WorkOrder[]> {
    if (!this.tokenStorage.read()) {
      return this.http.get<WorkOrderProps[]>('/demo-api/work-orders').pipe(
        map((items) => items.map((item) => this.toEntity(item))),
      );
    }

    return this.http.get<WorkOrderApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => WorkOrderApiMapper.toEntity(item))),
    );
  }

  override update(entity: WorkOrder): Observable<WorkOrder> {
    if (!this.tokenStorage.read()) {
      return this.http.put<WorkOrderProps>(
        `/demo-api/work-orders/${entity.id}`,
        { ...entity },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.put<WorkOrderApiResource>(
      `${this.url}/${entity.id}`,
      WorkOrderApiMapper.toUpdateRequest(entity),
    ).pipe(
      map((resource) => WorkOrderApiMapper.toEntity(resource)),
    );
  }

  assignTechnician(order: WorkOrder, technicianId: string): Observable<WorkOrder> {
    if (!this.tokenStorage.read()) {
      const draft = order.clone();
      draft.assign(technicianId);
      return this.update(draft);
    }

    const id = Number(technicianId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('A valid backend technician ID is required');
    }

    return this.http.patch<WorkOrderApiResource>(
      `${this.url}/${order.id}/assignment`,
      { technicianId: id },
    ).pipe(
      map((resource) => WorkOrderApiMapper.toEntity(resource)),
    );
  }

  override create(entity: WorkOrder): Observable<WorkOrder> {
    if (!this.tokenStorage.read()) {
      return this.http.post<WorkOrderProps>(
        '/demo-api/work-orders',
        { ...entity },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.post<WorkOrderApiResource>(
      this.url,
      WorkOrderApiMapper.toCreateRequest(entity),
    ).pipe(
      map((resource) => WorkOrderApiMapper.toEntity(resource)),
    );
  }
}
