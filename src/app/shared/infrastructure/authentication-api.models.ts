export interface SignInRequest {
  readonly email: string;
  readonly password: string;
}

export interface AuthenticatedAccountResponse {
  readonly id: number;
  readonly fullName: string;
  readonly email: string;
  readonly role: string;
  readonly plantId: number | null;
  readonly jobTitle: string;
}

export interface SignInResponse {
  readonly account: AuthenticatedAccountResponse;
  readonly token: string;
}
