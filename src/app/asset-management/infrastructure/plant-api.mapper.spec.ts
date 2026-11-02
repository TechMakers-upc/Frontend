import { PlantApiMapper } from './plant-api.mapper';
import { Plant } from '../domain/model/plant.entity';

describe('Plant API mapper', () => {
it('maps backend plant numbers to UI identifiers', () => {
  const item = PlantApiMapper.toEntity({id: 7, name: 'Central', city: 'Lima',
    address: '', displayName: 'Central · Lima'});
  expect(item.id).toBe('7');
  expect(item.city).toBe('Lima');
});

it('does not send client-side identifiers to the API', () => {
  const request = PlantApiMapper.toSaveRequest(
    new Plant({id: '99', name: 'Central', city: 'Lima', address: 'Av. 1'})
  );
  expect(request).toEqual({name: 'Central', city: 'Lima', address: 'Av. 1'});
});

});
