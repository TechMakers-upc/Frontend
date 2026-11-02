import { AssetApiMapper } from './asset-api.mapper';
import { Asset } from '../domain/model/asset.entity';

const resource = {
  id: 9, plantId: 1, code: 'M-01', name: 'Prensa',
  category: 'press', criticality: 'high', status: 'operational',
  statusChangedAt: '2026-10-01T10:00:00Z', location: 'Nave A',
  brand: 'A', model: 'P20', serialNumber: 'SN9', installedAt: '2025-01-01',
  description: '', manuals: [{title: 'Manual', url: 'https://example.org/manual', addedAt: '2026-01-01T00:00:00Z'}],
};

describe('Asset API mapper', () => {
it('preserves the related plant and technical manuals', () => {
  const item = AssetApiMapper.toEntity(resource);
  expect(item.id).toBe('9');
  expect(item.plantId).toBe('1');
  expect(item.manuals[0].title).toBe('Manual');
});

it('rejects a machine linked to an invalid plant', () => {
  const item = AssetApiMapper.toEntity(resource);
  item.plantId = 'demo-plant';
  expect(() => AssetApiMapper.toSaveRequest(item)).toThrow();
});

});
