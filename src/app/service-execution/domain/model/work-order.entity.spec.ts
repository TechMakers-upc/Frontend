import { WorkOrder } from './work-order.entity';

function order(technicianId: string | null = null): WorkOrder {
  return new WorkOrder({
    id: '50', code: 'OT-2026-0050', type: 'corrective',
    plantId: '1', assetId: '9', failureId: null, planId: null,
    title: 'Revisar maquina', description: '', priority: 'high',
    status: 'pending', technicianId, dueDate: '2026-10-08',
    createdAt: '2026-10-01T10:00:00Z', createdBy: '4',
    startedAt: null, completedAt: null, solution: null,
    workLog: [], partsUsed: [],
  });
}

describe('WorkOrder', () => {
it('rejects blank technician assignments', () => {
  const item = order();
  expect(() => item.assign('  ')).toThrow();
  expect(item.technicianId).toBeNull();
});

it('starts after assignment and saves the start timestamp', () => {
  const item = order('4');
  item.start('2026-10-02T10:00:00Z');
  expect(item.status).toBe('in-progress');
  expect(item.startedAt).toBe('2026-10-02T10:00:00Z');
});

it('rejects starting a work order twice', () => {
  const item = order('4');
  item.start('2026-10-02T10:00:00Z');
  expect(() => item.start('2026-10-02T11:00:00Z')).toThrow();
});

it('records trimmed work logs only during execution', () => {
  const item = order('4');
  expect(() => item.logWork('Nota', '4', '2026-10-02T11:00:00Z')).toThrow();
  item.start('2026-10-02T10:00:00Z');
  item.logWork(' Revisar faja ', '4', '2026-10-02T11:00:00Z');
  expect(item.workLog[0].note).toBe('Revisar faja');
});

it('rejects zero, fractional and unavailable work order usage', () => {
  const item = order('4');
  expect(() => item.registerPartUsage('12', 1, '2026-10-02')).toThrow();
  item.start('2026-10-02T10:00:00Z');
  expect(() => item.registerPartUsage('12', 0, '2026-10-02')).toThrow();
  expect(() => item.registerPartUsage('12', 1.5, '2026-10-02')).toThrow();
  item.registerPartUsage('12', 2, '2026-10-02');
  expect(item.partsUsed[0].quantity).toBe(2);
});

  // INSERTAR_CASOS
});
