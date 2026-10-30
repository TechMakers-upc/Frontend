import { Injectable } from '@angular/core';

const TOKEN_KEY = 'fixcore.auth-token';

@Injectable({ providedIn: 'root' })
export class AuthTokenStorage {
  read(): string | null {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      if (!token) return null;

      if (this.isExpired(token)) {
        this.clear();
        return null;
      }

      return token;
    } catch {
      return null;
    }
  }

  write(token: string): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Browser storage may be unavailable.
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Browser storage may be unavailable.
    }
  }

  private isExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      if (!payload) return true;

      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(base64)) as { exp?: unknown };

      if (typeof decoded.exp !== 'number' || !Number.isFinite(decoded.exp)) {
        return true;
      }

      return decoded.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }
}
