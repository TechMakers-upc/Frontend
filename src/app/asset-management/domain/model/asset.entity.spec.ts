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

it('changes status and its timestamp together', () => {
  const item = asset();
  item.markDown('2026-10-02T10:00:00Z');
  expect(item.status).toBe('down');
  expect(item.statusChangedAt).toBe('2026-10-02T10:00:00Z');
  item.markInMaintenance('2026-10-03T10:00:00Z');
  expect(item.status).toBe('maintenance');
  item.markOperational('2026-10-04T10:00:00Z');
  expect(item.status).toBe('operational');
});

it('does not reset the timestamp for an unchanged status', () => {
  const item = asset();
  item.markOperational('2026-11-01T00:00:00Z');
  expect(item.statusChangedAt).toBe('2026-10-01T10:00:00Z');
});

it('requires a title and http(s) link for a manual', () => {
  const item = asset();
  expect(() => item.addManual('', 'https://example.org', '2026-10-01')).toThrow();
  expect(() => item.addManual('Manual', 'file:///c/manual.pdf', '2026-10-01')).toThrow();
  expect(item.manuals).toHaveLength(0);
});

  // INSERTAR_CASOS
});
