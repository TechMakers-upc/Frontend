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

it('adds received stock to the current quantity', () => {
  const item = part();
  item.receive(5);
  expect(item.stock).toBe(13);
});

it('returns the adjustment delta and updates stock', () => {
  const item = part(8);
  expect(item.adjustTo(5)).toBe(-3);
  expect(item.stock).toBe(5);
});

it('does not allow consumption beyond available stock', () => {
  const item = part(2);
  expect(() => item.consume(3)).toThrow('Not enough stock');
  expect(item.stock).toBe(2);
});

  // INSERTAR_CASOS
});
