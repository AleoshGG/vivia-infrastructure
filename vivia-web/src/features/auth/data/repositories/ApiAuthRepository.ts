import type { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import type { Session } from '../../domain/entities/Session';
import { AuthException } from '../../domain/exceptions/AuthException';
import { loginResponseToSession } from '../mappers/loginResponseToSession';
import type { LoginResponseDto } from '../dtos/LoginResponseDto';
import { httpClient, HttpError } from '@/core/di';
import { sessionManager } from '@/core/session';

export class ApiAuthRepository implements IAuthRepository {
  async login(identifier: string, password: string): Promise<Session> {
    try {
      const dto = await httpClient.post<LoginResponseDto>('/auth/login/admin', { identifier, password });
      if (!dto.success) throw new AuthException(dto.message ?? 'Correo o contraseña incorrectos');
      return loginResponseToSession(dto);
    } catch (e) {
      if (e instanceof AuthException) throw e;
      if (e instanceof HttpError && (e.status === 401 || e.status === 403)) {
        throw new AuthException('Correo o contraseña incorrectos');
      }
      throw e;
    }
  }

  async logout(): Promise<void> {
    // Intenta invalidar el refresh token en el servidor; limpia local siempre.
    await httpClient.post('/auth/logout', {}).catch(() => {});
    sessionManager.clearSession();
  }
}
