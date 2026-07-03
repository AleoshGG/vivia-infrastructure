import { useState } from 'react';
import { loginUseCase } from '../../data/di';
import { sessionManager } from '@/core/session';
import { fcmSubscriptionService } from '@/core/notifications';
import { AuthException } from '../../domain/exceptions/AuthException';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function login(identifier: string, password: string) {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const session = await loginUseCase.execute(identifier, password);
      sessionManager.saveSession(session.accessToken, session.refreshToken);
      void fcmSubscriptionService.subscribeAfterLogin();
      setSuccess(true);
    } catch (e) {
      if (e instanceof AuthException) {
        setError(e.message);
      } else {
        setError('Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }

  return { login, loading, error, success };
}
