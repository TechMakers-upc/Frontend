import { SparePartApiMapper, StockMovementApiMapper } from './inventory-api.mapper';
import { SparePart } from '../domain/model/spare-part.entity';

const backendPart = {
  id: 12, plantId: 4, sku: 'REP-01', name: 'Rodamiento',
  category: 'mechanical', unit: 'unit', stock: 8, minStock: 3,
  location: 'A1', level: 'ok',
};

describe('Inventory API mappers', () => {
it('keeps backend identifiers and stock counts', () => {
  const item = SparePartApiMapper.toEntity(backendPart);
  expect(item.id).toBe('12');
  expect(item.plantId).toBe('4');
  expect(item.stock).toBe(8);
});

it('maps movement references and the resulting stock', () => {
  const movement = StockMovementApiMapper.toEntity({
    id: 50, plantId: 4, partId: 12, type: 'consumption', quantity: -2,
    stockAfter: 6, reason: 'OT', at: '2026-10-01T10:00:00Z',
    userId: 7, workOrderId: 20,
  });
  expect(movement.partId).toBe('12');
  expect(movement.workOrderId).toBe('20');
  expect(movement.stockAfter).toBe(6);
});

});
