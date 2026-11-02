import { Asset } from '../../../asset-management/domain/model/asset.entity';
import { Failure } from '../../../service-execution/domain/model/failure.entity';
import { WorkOrder } from '../../../service-execution/domain/model/work-order.entity';
import { availability, downtimeHours, mttrHours, preventiveCompliance, statusCounts } from './maintenance-metrics';

function machine(status: 'operational' | 'down' | 'maintenance'): Asset {
  return new Asset({ id: '1', plantId: '1', code: 'M1', name: 'Prensa',
    category: 'press', criticality: 'high', status,
    statusChangedAt: '2026-10-01T10:00:00Z', location: '', brand: '',
    model: '', serialNumber: '', installedAt: '', description: '', manuals: [] });
}

function metricOrder(type: 'corrective' | 'preventive', completed = true): WorkOrder {
  return new WorkOrder({ id: '1', code: 'OT-1', type, plantId: '1', assetId: '1',
    failureId: null, planId: null, title: 'Reparar', description: '', priority: 'high',
    status: completed ? 'completed' : 'pending', technicianId: '4', dueDate: '2026-10-03',
    createdAt: '2026-10-01T00:00:00Z', createdBy: '4',
    startedAt: completed ? '2026-10-02T10:00:00Z' : null,
    completedAt: completed ? '2026-10-02T12:00:00Z' : null,
    solution: completed ? 'Reparado' : null, workLog: [], partsUsed: [] });
}

describe('Maintenance metrics', () => {
it('counts downtime from stopped incidents only', () => {
  const f = new Failure({id: '1', plantId: '1', assetId: '1', kind: 'jam',
    description: '', lineStopped: true, priority: 'critical', status: 'resolved',
    reportedBy: '4', reportedAt: '2026-10-02T10:00:00Z',
    resolvedAt: '2026-10-02T13:00:00Z', workOrderId: null});
  expect(downtimeHours([f])).toBe(3);
});

it('reports the percentage of running machines', () => {
  expect(availability([machine('operational'), machine('down')])).toBe(50);
  expect(availability([])).toBeNull();
});

  // INSERTAR_CASOS
});
