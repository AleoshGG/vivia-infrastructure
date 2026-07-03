import { httpClient } from '@/core/di';
import { requestNotificationPermission } from './messaging';

const FCM_TOKEN_KEY = 'vivia_fcm_token';

export const fcmSubscriptionService = {
  saveFcmToken(token: string): void {
    localStorage.setItem(FCM_TOKEN_KEY, token);
  },

  getFcmToken(): string | null {
    return localStorage.getItem(FCM_TOKEN_KEY);
  },

  clearFcmToken(): void {
    localStorage.removeItem(FCM_TOKEN_KEY);
  },

  /**
   * Pide permiso de notificaciones, obtiene el FCM token y lo registra en el backend.
   * Se llama después de un login exitoso. No bloquea ni lanza errores — las
   * notificaciones son opcionales.
   */
  async subscribeAfterLogin(): Promise<void> {
    try {
      const token = await requestNotificationPermission();
      if (!token) return;

      this.saveFcmToken(token);
      await httpClient.post('/admin/fcm/subscribe', { fcmToken: token });
    } catch {
      // Las notificaciones son opcionales — el fallo no bloquea el login
    }
  },

  /**
   * Desregistra el token FCM del backend y lo elimina del almacenamiento local.
   * Se llama antes de cerrar sesión.
   */
  async unsubscribeBeforeLogout(): Promise<void> {
    try {
      const token = this.getFcmToken();
      if (!token) return;

      await httpClient.delete('/admin/fcm/subscribe', { fcmToken: token });
    } catch {
      // Si falla la petición, igual limpiamos el token local
    } finally {
      this.clearFcmToken();
    }
  },
};
