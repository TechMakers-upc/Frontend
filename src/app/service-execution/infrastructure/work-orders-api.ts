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
