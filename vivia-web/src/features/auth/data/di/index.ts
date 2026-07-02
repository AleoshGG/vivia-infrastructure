import { ApiAuthRepository } from '../repositories/ApiAuthRepository';
import { LoginUseCase } from '../../domain/usecases/LoginUseCase';
import { LogoutUseCase } from '../../domain/usecases/LogoutUseCase';

const authRepository = new ApiAuthRepository();

export const loginUseCase = new LoginUseCase(authRepository);
export const logoutUseCase = new LogoutUseCase(authRepository);
