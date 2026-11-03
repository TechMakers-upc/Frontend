import { UserAccountAssembler } from './user-account.assembler';

const resource = {
  id: 3, fullName: 'José Ramírez', email: 'jose.ramirez@fixcore.demo',
  role: 'technician', plantId: 1, jobTitle: 'Técnico electromecánico',
};

describe('User account assembler', () => {
it('turns numeric user and plant ids from the API into string ids', () => {
  const account = UserAccountAssembler.toEntity(resource);
  expect(account?.id).toBe('3');
  expect(account?.plantId).toBe('1');
});

it('keeps accounts without a plant', () => {
  const account = UserAccountAssembler.toEntity({ ...resource, id: 2, role: 'operations-manager', plantId: null });
  expect(account?.id).toBe('2');
  expect(account?.plantId).toBeNull();
});

it('ignores accounts with an unknown role', () => {
  expect(UserAccountAssembler.toEntity({ ...resource, role: 'admin' })).toBeNull();
});

});
