import { sessionManager } from '../session';
import { refreshTokens } from '../http';

const BASE_URL = 'https://vivia.aleosh.online/api';

const RECONNECT_INITIAL_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;

export interface SseSubscription {
  close: () => void;
}

export const sseClient = {
  subscribe(
    path: string,
    eventName: string,
    onMessage: (data: string) => void,
    onOpen?: () => void,
    onError?: (e: Error) => void,
  ): SseSubscription {
    let closed = false;
    let connected = false;
    let controller: AbortController | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = RECONNECT_INITIAL_DELAY_MS;

    const scheduleReconnect = () => {
      if (closed) return;
      reconnectTimer = setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY_MS);
    };

    const connect = async () => {
      controller = new AbortController();
      console.log(`[SSE] Conectando a ${path}...`);

      try {
        const token = sessionManager.getAccessToken();
        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${BASE_URL}${path}`, {
          headers,
          signal: controller.signal,
        });

        if (!response.ok) {
          console.log(`[SSE] Error al conectar a ${path}: HTTP ${response.status}`);

          // Token expirado: se refresca la sesión para que el siguiente
          // intento (scheduleReconnect) use el access token nuevo
          if (response.status === 401 || response.status === 403) {
            try {
              await refreshTokens();
            } catch {
              // refresh falló — la sesión ya no es recuperable, se sigue reintentando igual
            }
          }

          onError?.(new Error(`HTTP ${response.status}`));
          scheduleReconnect();
          return;
        }

        reconnectDelay = RECONNECT_INITIAL_DELAY_MS;
        connected = true;
        console.log(`[SSE] Conectado a ${path}`);
        onOpen?.();

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Los eventos SSE se separan por doble salto de línea
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() ?? '';

          for (const chunk of chunks) {
            let currentEvent = '';
            let data = '';

            for (const line of chunk.split('\n')) {
              if (line.startsWith('event:')) currentEvent = line.slice(6).trim();
              else if (line.startsWith('data:')) data = line.slice(5).trim();
            }

            if (currentEvent === eventName && data) {
              onMessage(data);
            }
          }
        }

        // El servidor cerró el stream (deploy, timeout de nginx…): reintentar
        connected = false;
        if (!closed) console.log(`[SSE] Desconectado de ${path} por el servidor, reintentando`);
        scheduleReconnect();
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          console.log(`[SSE] Error de red en ${path}: ${(e as Error).message}`);
          onError?.(e as Error);
          scheduleReconnect();
        }
      }
    };

    connect();

    return {
      close: () => {
        if (closed) return;
        closed = true;
        if (reconnectTimer !== null) clearTimeout(reconnectTimer);
        controller?.abort();
        // Solo se reporta si había una conexión abierta: cerrar una suscripción
        // que nunca conectó (StrictMode monta/desmonta en dev) no es una desconexión
        if (connected) {
          connected = false;
          console.log(`[SSE] Desconectado de ${path} por el cliente`);
        }
      },
    };
  },
};
