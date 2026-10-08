import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { WorkOrder, WorkOrderProps } from '../domain/model/work-order.entity';

@Injectable({ providedIn: 'root' })
export class WorkOrdersApi extends BaseApi<WorkOrder, WorkOrderProps> {
  protected readonly endpointPath = environment.workOrdersEndpointPath;

  protected toEntity(resource: WorkOrderProps): WorkOrder {
    return new WorkOrder({ ...resource, workLog: resource.workLog ?? [], partsUsed: resource.partsUsed ?? [] });
  }
}
