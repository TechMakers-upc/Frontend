import { SparePart } from './spare-part.entity';

function part(stock = 8, minStock = 3): SparePart {
  return new SparePart({
    id: '12', plantId: '4', sku: 'REP-01', name: 'Rodamiento',
    category: 'mechanical', unit: 'unit', stock, minStock, location: 'A1',
  });
}

describe('SparePart', () => {
it('rejects fractional usage without changing stock', () => {
  const item = part();
  expect(() => item.consume(1.5)).toThrow();
  expect(item.stock).toBe(8);
});

  // INSERTAR_CASOS
});
