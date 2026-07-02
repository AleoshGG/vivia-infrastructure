import type { Session } from '../entities/Session';

export interface IAuthRepository {
  login(identifier: string, password: string): Promise<Session>;
  logout(): Promise<void>;
}
