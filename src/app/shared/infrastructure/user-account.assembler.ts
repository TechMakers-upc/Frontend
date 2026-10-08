import { isRole } from '../domain/model/role';
import { UserAccount } from '../domain/model/user-account.entity';
import { StoredUserAccount } from './user-account.resource';

export class UserAccountAssembler {
  static toEntity(resource: StoredUserAccount): UserAccount | null {
    if (!isRole(resource.role)) return null;
    return new UserAccount(
      resource.id,
      resource.fullName,
      resource.email,
      resource.role,
      resource.plantId,
      resource.jobTitle,
    );
  }

  static toStored(account: UserAccount): StoredUserAccount {
    return {
      id: account.id,
      fullName: account.fullName,
      email: account.email,
      role: account.role,
      plantId: account.plantId,
      jobTitle: account.jobTitle,
    };
  }
}
