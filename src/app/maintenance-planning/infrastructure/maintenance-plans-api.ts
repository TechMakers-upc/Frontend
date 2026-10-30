import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { AuthTokenStorage } from '../../shared/infrastructure/auth-token.storage';
import { MaintenancePlan, MaintenancePlanProps } from '../domain/model/maintenance-plan.entity';
import { MaintenancePlanApiMapper } from './maintenance-plan-api.mapper';
import {
  MaintenancePlanApiResource,
  RescheduleMaintenancePlanRequest,
} from './maintenance-plan-api.models';

@Injectable({ providedIn: 'root' })
export class MaintenancePlansApi extends BaseApi<MaintenancePlan, MaintenancePlanProps> {
  protected readonly endpointPath = environment.maintenancePlansEndpointPath;

  private readonly tokenStorage = inject(AuthTokenStorage);

  protected toEntity(resource: MaintenancePlanProps): MaintenancePlan {
    return new MaintenancePlan(resource);
  }

  override create(entity: MaintenancePlan): Observable<MaintenancePlan> {
    if (!this.tokenStorage.read()) {
      return this.http.post<MaintenancePlanProps>(
        '/demo-api/maintenance-plans',
        { ...entity },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.post<MaintenancePlanApiResource>(
      this.url,
      MaintenancePlanApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => MaintenancePlanApiMapper.toEntity(resource)),
    );
  }

  override update(entity: MaintenancePlan): Observable<MaintenancePlan> {
    if (!this.tokenStorage.read()) {
      return this.http.put<MaintenancePlanProps>(
        `/demo-api/maintenance-plans/${entity.id}`,
        { ...entity },
      ).pipe(
        map((resource) => this.toEntity(resource)),
      );
    }

    return this.http.put<MaintenancePlanApiResource>(
      `${this.url}/${entity.id}`,
      MaintenancePlanApiMapper.toSaveRequest(entity),
    ).pipe(
      map((resource) => MaintenancePlanApiMapper.toEntity(resource)),
    );
  }

  suspendPlan(plan: MaintenancePlan): Observable<MaintenancePlan> {
    if (!this.tokenStorage.read()) {
      const draft = plan.clone();
      draft.suspend();
      return this.update(draft);
    }

    return this.http.post<MaintenancePlanApiResource>(
      `${this.url}/${plan.id}/suspension`,
      {},
    ).pipe(
      map((resource) => MaintenancePlanApiMapper.toEntity(resource)),
    );
  }

  reactivatePlan(plan: MaintenancePlan): Observable<MaintenancePlan> {
    if (!this.tokenStorage.read()) {
      const draft = plan.clone();
      draft.reactivate();
      return this.update(draft);
    }

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

    if (!this.tokenStorage.read()) {
      return this.update(draft);
    }

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

  override getAll(): Observable<MaintenancePlan[]> {
    if (!this.tokenStorage.read()) {
      return this.http.get<MaintenancePlanProps[]>('/demo-api/maintenance-plans').pipe(
        map((items) => items.map((item) => this.toEntity(item))),
      );
    }

    return this.http.get<MaintenancePlanApiResource[]>(this.url).pipe(
      map((items) => items.map((item) => MaintenancePlanApiMapper.toEntity(item))),
    );
  }
}
