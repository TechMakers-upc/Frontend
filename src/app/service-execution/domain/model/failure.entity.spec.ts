import { Failure } from './failure.entity';

function failure(stopped = false): Failure {
  return new Failure({
    id: '30', plantId: '1', assetId: '9', kind: 'noise',
    description: 'Ruido', lineStopped: stopped,
    priority: stopped ? 'critical' : null, status: 'open',
    reportedBy: '4', reportedAt: '2026-10-01T10:00:00Z',
    resolvedAt: null, workOrderId: null,
  });
}

describe('Failure', () => {
it('starts a stopped-line incident at critical priority', () => {
  const item = Failure.report({plantId: '1', assetId: '9', kind: 'jam',
    description: ' Atasco ', lineStopped: true, reportedBy: '4'});
  expect(item.priority).toBe('critical');
  expect(item.description).toBe('Atasco');
  expect(item.status).toBe('open');
});

it('leaves an incident without a stopped line for management priority', () => {
  const item = Failure.report({plantId: '1', assetId: '9', kind: 'noise',
    description: 'Ruido', lineStopped: false, reportedBy: '4'});
  expect(item.priority).toBeNull();
  expect(item.needsWorkOrder).toBe(true);
});

it('rejects changes to resolved incident priority', () => {
  const item = failure();
  item.resolve('2026-10-01T12:00:00Z');
  expect(() => item.prioritize('high')).toThrow();
});

it('associates the first order and marks the incident in progress', () => {
  const item = failure();
  item.attachWorkOrder('51');
  expect(item.workOrderId).toBe('51');
  expect(item.status).toBe('in-progress');
});

  // INSERTAR_CASOS
});
