export interface UserAccountResource {
  id: string | number;
  fullName: string;
  email: string;
  password: string;
  role: string;
  plantId: string | number | null;
  jobTitle: string;
}

export type StoredUserAccount = Omit<UserAccountResource, 'password'>;
