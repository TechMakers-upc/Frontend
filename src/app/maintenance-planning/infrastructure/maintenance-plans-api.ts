import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { MaintenancePlan, MaintenancePlanProps } from '../domain/model/maintenance-plan.entity';
import { MaintenancePlanApiMapper } from './maintenance-plan-api.mapper';
import {
  MaintenancePlanApiResource,
  RegisterPlanCompletionRequest,
  RescheduleMaintenancePlanRequest,

} from './maintenance-plan-api.models';

@Injectable({ providedIn: 'root' })
export class MaintenancePlansApi extends BaseApi<MaintenancePlan, MaintenancePlanProps> {
  protected readonly endpointPath = environment.maintenancePlansEndpointPath;


  protected toEntity(resource: MaintenancePlanProps): MaintenancePlan {
    return new MaintenancePlan(resource);
  }

  override create(entity: MaintenancePlan): Observable<MaintenancePlan> {


    return this.http.post<MaintenancePlanApiResource>(
      this.url,
      MaintenancePlanApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => MaintenancePlanApiMapper.toEntity(resource)),
    );
  }

  override update(entity: MaintenancePlan): Observable<MaintenancePlan> {


    return this.http.put<MaintenancePlanApiResource>(
      `${this.url}/${entity.id}`,
      MaintenancePlanApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => MaintenancePlanApiMapper.toEntity(resource)),
    );
  }

  suspendPlan(plan: MaintenancePlan): Observable<MaintenancePlan> {


    return this.http.post<MaintenancePlanApiResource>(
      `${this.url}/${plan.id}/suspension`,
      {},
    ).pipe(
      map((resource) => MaintenancePlanApiMapper.toEntity(resource)),
    );
  }

  reactivatePlan(plan: MaintenancePlan): Observable<MaintenancePlan> {


    return this.http.post<MaintenancePlanApiResource>(
      `${this.url}/${plan.id}/reactivation`,
      {},
    ).pipe(
      map((resource) => MaintenancePlanApiMapper.toEntity(resource)),
    );
  }

  reschedulePlan(
    plan: MaintenancePlan,
    nextDueDate: string,
  ): Observable<MaintenancePlan> {
    const draft = plan.clone();
    draft.reschedule(nextDueDate);



    const request: RescheduleMaintenancePlanRequest = {
      nextDueDate: draft.nextDueDate,
    };

    return this.http.patch<MaintenancePlanApiResource>(
      `${this.url}/${plan.id}/schedule`,
      request,
    ).pipe(
      map((resource) => MaintenancePlanApiMapper.toEntity(resource)),
    );
  }

registerCompletion(plan: MaintenancePlan, completedOn: string): Observable<MaintenancePlan> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(completedOn)) {
    throw new Error('A valid completion date is required');
  }



  const request: RegisterPlanCompletionRequest = { completedOn };
  return this.http.post<MaintenancePlanApiResource>(
    `${this.url}/${plan.id}/completions`,
    request,
  ).pipe(map((resource) => MaintenancePlanApiMapper.toEntity(resource)));
}

  override delete(id: string): Observable<void> {


    return this.http.delete<void>(`${this.url}/${id}`);
  }

  override getAll(): Observable<MaintenancePlan[]> {


    return this.http.get<MaintenancePlanApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => MaintenancePlanApiMapper.toEntity(item))),
    );
  }
}
