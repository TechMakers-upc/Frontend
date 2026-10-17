import { Observable } from 'rxjs';

import { UserAccount } from '../domain/model/user-account.entity';

export interface SignInCredentials {
  readonly email: string;
  readonly password: string;
}

export interface SignInResult {
  readonly account: UserAccount;
}

export abstract class AuthenticationGateway {
  abstract signIn(credentials: SignInCredentials): Observable<SignInResult>;
}
