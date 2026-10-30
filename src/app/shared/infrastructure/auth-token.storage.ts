import { Injectable } from '@angular/core';

const TOKEN_KEY = 'fixcore.auth-token';

@Injectable({ providedIn: 'root' })
export class AuthTokenStorage {
  read(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  write(token: string): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }
}
