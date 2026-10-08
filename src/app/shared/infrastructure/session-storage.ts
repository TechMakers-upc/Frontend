import { Injectable } from '@angular/core';

import { UserAccount } from '../domain/model/user-account.entity';
import { UserAccountAssembler } from './user-account.assembler';
import { StoredUserAccount } from './user-account.resource';

const SESSION_KEY = 'fixcore.session';


@Injectable({ providedIn: 'root' })
export class SessionStorage {
  read(): UserAccount | null {
    const raw = this.safeGet(localStorage) ?? this.safeGet(sessionStorage);
    if (!raw) return null;
    try {
      return UserAccountAssembler.toEntity(JSON.parse(raw) as StoredUserAccount);
    } catch {
      return null;
    }
  }

  write(account: UserAccount, persistent: boolean): void {
    this.clear();
    const target = persistent ? localStorage : sessionStorage;
    try {
      target.setItem(SESSION_KEY, JSON.stringify(UserAccountAssembler.toStored(account)));
    } catch {
      // Storage can be unavailable in private mode; the in-memory session still works.
    }
  }

  clear(): void {
    for (const storage of [localStorage, sessionStorage]) {
      try {
        storage.removeItem(SESSION_KEY);
      } catch {
        // Ignore unavailable storage.
      }
    }
  }

  private safeGet(storage: Storage): string | null {
    try {
      return storage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }
}
