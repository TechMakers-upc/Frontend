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

  // INSERTAR_CASOS
});
