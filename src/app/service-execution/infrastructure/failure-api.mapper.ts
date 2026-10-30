import { Priority } from '../domain/model/priority';
import {
  Failure,
  FailureKind,
  FailureStatus,
} from '../domain/model/failure.entity';
import {
  FailureApiResource,
  ReportFailureRequest,
} from './failure-api.models';

export class FailureApiMapper {
  static toEntity(resource: FailureApiResource): Failure {
    return new Failure({
      id: String(resource.id),
      plantId: String(resource.plantId),
      assetId: String(resource.assetId),
      kind: resource.kind as FailureKind,
      description: resource.description ?? '',
      lineStopped: resource.lineStopped,
      priority: resource.priority as Priority | null,
      status: resource.status as FailureStatus,
      reportedBy: String(resource.reportedBy),
      reportedAt: resource.reportedAt,
      resolvedAt: resource.resolvedAt,
      workOrderId: resource.workOrderId === null
        ? null
        : String(resource.workOrderId),
    });
  }

  static toReportRequest(failure: Failure): ReportFailureRequest {
    const assetId = Number(failure.assetId);

    if (!Number.isSafeInteger(assetId) || assetId <= 0) {
      throw new Error('A valid backend asset ID is required');
    }

    return {
      assetId,
      kind: failure.kind,
      description: failure.description,
      lineStopped: failure.lineStopped,
    };
  }
}
