import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';
import { firebaseApp } from './firebaseApp';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

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
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js',
      ),
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
