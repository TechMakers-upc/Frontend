import { Plant } from './plant.entity';

function plant(name = 'Central', city = 'Lima'): Plant {
  return new Plant({ id: '1', name, city, address: 'Av. Industrial 10' });
}

describe('Plant', () => {
it('does not duplicate the city already present in a name', () => {
  expect(plant('Lima Central', 'Lima').displayName).toBe('Lima Central');
  expect(plant('Central', 'Lima').displayName).toBe('Central · Lima');
});

  // INSERTAR_CASOS
});
