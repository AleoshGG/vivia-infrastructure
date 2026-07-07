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
      console.info('[FCM] subscribeAfterLogin: iniciando');
      const token = await requestNotificationPermission();
      if (!token) {
        console.warn('[FCM] sin token — no se llama a la API');
        return;
      }

      this.saveFcmToken(token);
      console.info('[FCM] enviando POST /admin/fcm/subscribe');
      const res = await httpClient.post('/admin/fcm/subscribe', { fcmToken: token });
      console.info('[FCM] respuesta del backend:', res);
    } catch (e) {
      // Las notificaciones son opcionales — el fallo no bloquea el login
      console.error('[FCM] subscribeAfterLogin falló:', e);
    }
  },

  /**
   * Desregistra el token FCM del backend y lo elimina del almacenamiento local.
   * Se llama antes de cerrar sesión.
   */
  async unsubscribeBeforeLogout(): Promise<void> {
    try {
      const token = this.getFcmToken();
      if (!token) {
        console.warn('[FCM] unsubscribeBeforeLogout: no hay token guardado');
        return;
      }

      console.info('[FCM] enviando DELETE /admin/fcm/subscribe');
      await httpClient.delete('/admin/fcm/subscribe', { fcmToken: token });
    } catch (e) {
      // Si falla la petición, igual limpiamos el token local
      console.error('[FCM] unsubscribeBeforeLogout falló:', e);
    } finally {
      this.clearFcmToken();
    }
  },
};
