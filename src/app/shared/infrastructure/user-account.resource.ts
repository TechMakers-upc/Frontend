export interface UserAccountResource {
  id: string;
  fullName: string;
  email: string;
  password: string;
  role: string;
  plantId: string | null;
  jobTitle: string;
}

export type StoredUserAccount = Omit<UserAccountResource, 'password'>;
