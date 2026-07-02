import type { LoginResponseDto } from '../dtos/LoginResponseDto';
import type { Session } from '../../domain/entities/Session';

export function loginResponseToSession(dto: LoginResponseDto): Session {
  return {
    accessToken: dto.data.accessToken,
    refreshToken: dto.data.refreshToken,
  };
}
