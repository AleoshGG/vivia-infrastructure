const ACCESS_KEY = 'vivia_access_token';
const REFRESH_KEY = 'vivia_refresh_token';

export const sessionManager = {
  saveSession(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },

  clearSession(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },

  hasSession(): boolean {
    return localStorage.getItem(ACCESS_KEY) !== null;
  },
};
