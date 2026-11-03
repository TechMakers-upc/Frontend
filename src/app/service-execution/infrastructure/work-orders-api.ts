import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { WorkOrder, WorkOrderProps } from '../domain/model/work-order.entity';
import { WorkOrderApiMapper } from './work-order-api.mapper';
import { WorkOrderApiResource } from './work-order-api.models';

@Injectable({ providedIn: 'root' })
export class WorkOrdersApi extends BaseApi<WorkOrder, WorkOrderProps> {
  protected readonly endpointPath = environment.workOrdersEndpointPath;


  protected toEntity(resource: WorkOrderProps): WorkOrder {
    return new WorkOrder({
      ...resource,
      workLog: resource.workLog ?? [],
      partsUsed: resource.partsUsed ?? [],
    });
  }

  override getAll(): Observable<WorkOrder[]> {


    return this.http.get<WorkOrderApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => WorkOrderApiMapper.toEntity(item))),
    );
  }

  override update(entity: WorkOrder): Observable<WorkOrder> {


    return this.http.put<WorkOrderApiResource>(
      `${this.url}/${entity.id}`,
      WorkOrderApiMapper.toUpdateRequest(entity),
    ).pipe(
      map((resource) => WorkOrderApiMapper.toEntity(resource)),
    );
  }

  registerPartUsage(
    order: WorkOrder,
    partId: string,
    quantity: number,
    at: string,
  ): Observable<WorkOrder> {
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive integer');
    }



    const id = Number(partId);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error('A valid backend spare part ID is required');
    }

    return this.http.post<WorkOrderApiResource>(
      `${this.url}/${order.id}/part-usages`,
      { partId: id, quantity },
    ).pipe(
      map((resource) => WorkOrderApiMapper.toEntity(resource)),
    );
  }

  logWork(
    order: WorkOrder,
    note: string,
    authorId: string,
    at: string,
  ): Observable<WorkOrder> {
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      throw new Error('A work note is required');
    }



    return this.http.post<WorkOrderApiResource>(
      `${this.url}/${order.id}/work-logs`,
      { note: trimmedNote },
    ).pipe(
      map((resource) => WorkOrderApiMapper.toEntity(resource)),
    );
  }

  completeOrder(
    order: WorkOrder,
    solution: string,
    at: string,
  ): Observable<WorkOrder> {
    const trimmedSolution = solution.trim();

    if (!trimmedSolution) {
      throw new Error('A work order solution is required');
    }



    return this.http.post<WorkOrderApiResource>(
      `${this.url}/${order.id}/completion`,
      { solution: trimmedSolution },
    ).pipe(
      map((resource) => WorkOrderApiMapper.toEntity(resource)),
    );
  }

  startOrder(order: WorkOrder, at: string): Observable<WorkOrder> {


    return this.http.post<WorkOrderApiResource>(
      `${this.url}/${order.id}/start`,
      {},
    ).pipe(
      map((resource) => WorkOrderApiMapper.toEntity(resource)),
    );
  }

  assignTechnician(order: WorkOrder, technicianId: string): Observable<WorkOrder> {


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

  override delete(id: string): Observable<void> {


    return this.http.delete<void>(`${this.url}/${id}`);
  }

  override create(entity: WorkOrder): Observable<WorkOrder> {


    return this.http.post<WorkOrderApiResource>(
      this.url,
      WorkOrderApiMapper.toCreateRequest(entity),
    ).pipe(
      map((resource) => WorkOrderApiMapper.toEntity(resource)),
    );
  }
}
