import { Role } from '../../domain/model/role';

export const ROLE_HOME: Record<Role, string> = {
  'plant-manager': '/dashboard',
  'operations-manager': '/overview',
  technician: '/today',
};
