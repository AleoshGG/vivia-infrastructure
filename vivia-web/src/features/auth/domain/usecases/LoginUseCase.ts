import type { IAuthRepository } from '../repositories/IAuthRepository';
import type { Session } from '../entities/Session';
import { AuthException } from '../exceptions/AuthException';

export class LoginUseCase {
  private readonly repo: IAuthRepository;

  constructor(repo: IAuthRepository) {
    this.repo = repo;
  }

  async execute(identifier: string, password: string): Promise<Session> {
    if (!identifier.trim() || !password.trim()) {
      throw new AuthException('El correo y la contraseña son requeridos');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier.trim())) {
      throw new AuthException('El formato del correo electrónico no es válido');
    }

    if (password.length < 8) {
      throw new AuthException('La contraseña debe tener al menos 8 caracteres');
    }

    return this.repo.login(identifier, password);
  }
}
