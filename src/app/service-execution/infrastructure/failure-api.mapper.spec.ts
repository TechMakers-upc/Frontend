import { FailureApiMapper } from './failure-api.mapper';
import { Failure } from '../domain/model/failure.entity';

const resource = {
  id: 30, plantId: 1, assetId: 9, kind: 'noise', description: 'Ruido',
  lineStopped: true, priority: 'critical', status: 'open', reportedBy: 4,
  reportedAt: '2026-10-01T10:00:00Z', resolvedAt: null, workOrderId: null,
  downtimeHours: 2,
  needsWorkOrder: true,
};

describe('Failure API mapper', () => {
it('keeps plant, machine and user references as UI identifiers', () => {
  const item = FailureApiMapper.toEntity(resource);
  expect(item.id).toBe('30');
  expect(item.plantId).toBe('1');
  expect(item.assetId).toBe('9');
  expect(item.reportedBy).toBe('4');
});

it('does not send fake identifiers to the backend', () => {
  const item = FailureApiMapper.toEntity(resource);
  item.assetId = 'local-machine';
  expect(() => FailureApiMapper.toReportRequest(item)).toThrow();
});

});
