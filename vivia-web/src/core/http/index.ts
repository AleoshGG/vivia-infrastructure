import { sessionManager } from '../session';

const BASE_URL = 'https://vivia.aleosh.online/api';
const REFRESH_PATH = '/auth/refresh';

// Rutas que nunca deben disparar el interceptor de refresh (no hay sesión activa)
const AUTH_PATHS = new Set(['/auth/login', '/auth/refresh']);

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

interface RefreshResponseDto {
  success: boolean;
  data: { accessToken: string; refreshToken: string };
  message: string;
}

async function refreshTokens(): Promise<void> {
  const refreshToken = sessionManager.getRefreshToken();
  if (!refreshToken) {
    sessionManager.clearSession();
    throw new HttpError(401, 'Sesión expirada. Inicia sesión nuevamente.');
  }

  const response = await fetch(`${BASE_URL}${REFRESH_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    sessionManager.clearSession();
    throw new HttpError(401, 'Sesión expirada. Inicia sesión nuevamente.');
  }

  const json: RefreshResponseDto = await response.json();
  if (!json.success) {
    sessionManager.clearSession();
    throw new HttpError(401, json.message ?? 'Sesión expirada. Inicia sesión nuevamente.');
  }

  sessionManager.saveSession(json.data.accessToken, json.data.refreshToken);
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isRetry = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const accessToken = sessionManager.getAccessToken();
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const isAuthError = response.status === 401 || response.status === 403;
  if (isAuthError && !isRetry && !AUTH_PATHS.has(path)) {
    await refreshTokens();
    return request<T>(method, path, body, true);
  }

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new HttpError(response.status, errorJson.message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const httpClient = {
  get<T>(path: string): Promise<T> {
    return request<T>('GET', path);
  },
  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>('POST', path, body);
  },
  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>('PUT', path, body);
  },
  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>('PATCH', path, body);
  },
  delete<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('DELETE', path, body);
  },
};
