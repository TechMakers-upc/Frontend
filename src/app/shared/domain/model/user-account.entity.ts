import { Role } from './role';

export class UserAccount {
  constructor(
    readonly id: string,
    readonly fullName: string,
    readonly email: string,
    readonly role: Role,
    readonly plantId: string | null,
    readonly jobTitle: string,
  ) {}

  get firstName(): string {
    return this.fullName.split(' ')[0] ?? this.fullName;
  }

  get initials(): string {
    return this.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]!.toUpperCase())
      .join('');
  }
}
