import type { IAuthRepository } from '../repositories/IAuthRepository';

export class LogoutUseCase {
  private readonly repo: IAuthRepository;

  constructor(repo: IAuthRepository) {
    this.repo = repo;
  }

  async execute(): Promise<void> {
    await this.repo.logout();
  }
}
