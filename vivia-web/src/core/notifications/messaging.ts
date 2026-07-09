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
  if (typeof window === 'undefined') return null;

  try {
    messagingInstance = getMessaging(firebaseApp);
    return messagingInstance;
  } catch {
    return null;
  }
}

/**
 * Solicita permiso de notificaciones al usuario y devuelve el FCM token.
 * Devuelve null si el permiso fue denegado o FCM no está disponible.
 */
export async function requestNotificationPermission(): Promise<string | null> {
  const messaging = getMessagingInstance();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  try {
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
    );

    // register() resuelve con el SW aún en "installing" — PushManager.subscribe
    // (dentro de getToken) falla si el SW no está activo todavía.
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token;
  } catch {
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
