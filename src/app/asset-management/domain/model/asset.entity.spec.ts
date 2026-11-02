import { Asset } from './asset.entity';

function asset(): Asset {
  return new Asset({
    id: '9', plantId: '1', code: 'M-01', name: 'Prensa',
    category: 'press', criticality: 'high', status: 'operational',
    statusChangedAt: '2026-10-01T10:00:00Z', location: 'Nave A',
    brand: 'A', model: 'P20', serialNumber: 'SN9', installedAt: '2025-01-01',
    description: '', manuals: [],
  });
}

describe('Asset', () => {
it('refuses to save a machine without code or name', () => {
  const item = asset();
  const details = { code: '', name: 'Prensa', category: 'press' as const,
    criticality: 'high' as const, location: '', brand: '', model: '',
    serialNumber: '', installedAt: '', description: '' };
  expect(() => item.updateDetails(details)).toThrow();
  expect(() => item.updateDetails({...details, code: 'M-01', name: ' '})).toThrow();
});

it('trims and uppercases the registered machine code', () => {
  const item = asset();
  item.updateDetails({code: ' p-20 ', name: ' Prensa 2 ', category: 'press',
    criticality: 'high', location: '', brand: '', model: '', serialNumber: '',
    installedAt: '', description: ''});
  expect(item.code).toBe('P-20');
  expect(item.name).toBe('Prensa 2');
});

  // INSERTAR_CASOS
});
