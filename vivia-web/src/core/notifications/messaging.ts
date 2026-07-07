import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';
import { firebaseApp } from './firebaseApp';

// Clave pública VAPID (Web Push) — no es un secreto; se hardcodea junto con
// la config de firebaseApp.ts para no depender de variables de entorno en el build.
const VAPID_KEY =
  'BJCNFdcE_1aZqMywIbonTDHRNwJbk1TRdZfCYVX6Xb_210N0AnUG7f9GmSSbwZFkqVoADEKryS3OcmjHjtlO37Q';

let messagingInstance: Messaging | null = null;

function getMessagingInstance(): Messaging | null {
  if (messagingInstance) return messagingInstance;

  // FCM no está disponible en Safari sin soporte de SW o en entornos sin window
  if (typeof window === 'undefined') {
    console.warn('[FCM] window no disponible — entorno sin soporte');
    return null;
  }

  try {
    messagingInstance = getMessaging(firebaseApp);
    return messagingInstance;
  } catch (e) {
    console.error('[FCM] getMessaging falló:', e);
    return null;
  }
}

/**
 * Solicita permiso de notificaciones al usuario y devuelve el FCM token.
 * Devuelve null si el permiso fue denegado o FCM no está disponible.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  const messaging = getMessagingInstance();
  if (!messaging) {
    console.warn('[FCM] messaging no disponible — se omite el registro');
    return null;
  }

  const permission = await Notification.requestPermission();
  console.info('[FCM] permiso de notificaciones:', permission);
  if (permission !== 'granted') return null;

  try {
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
    );
    console.info('[FCM] service worker registrado, scope:', registration.scope);

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    console.info('[FCM] token obtenido:', token ? `${token.slice(0, 12)}…` : token);
    return token;
  } catch (e) {
    console.error('[FCM] error al obtener el token:', e);
    return null;
  }
}

/**
 * Suscribe a mensajes recibidos mientras la app está en primer plano.
 * Devuelve una función unsubscribe.
 */
export function onForegroundMessage(
  handler: (payload: MessagePayload) => void,
): () => void {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};

  return onMessage(messaging, handler);
}
