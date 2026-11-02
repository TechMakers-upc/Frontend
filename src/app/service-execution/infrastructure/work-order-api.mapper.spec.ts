import { WorkOrderApiMapper } from './work-order-api.mapper';
import { WorkOrder } from '../domain/model/work-order.entity';

const resource = {
  id: 50, code: 'OT-2026-0050', type: 'corrective',
  plantId: 1, assetId: 9, failureId: null, planId: null,
  title: 'Revisar maquina', description: '', priority: 'high',
  status: 'pending', technicianId: 4, dueDate: '2026-10-08',
  createdAt: '2026-10-01T10:00:00Z', createdBy: 4,
  startedAt: null, completedAt: null, solution: null,
  workLog: [], partsUsed: [], overdue: false, repairHours: null,
};

describe('Work order API mapper', () => {
it('sends numeric asset and technician references', () => {
  const item = WorkOrderApiMapper.toEntity(resource);
  const request = WorkOrderApiMapper.toCreateRequest(item);
  expect(request.assetId).toBe(9);
  expect(request.technicianId).toBe(4);
  expect(request.type).toBe('corrective');
});

});
