import { sessionManager } from '../session';

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
          onError?.(new Error(`HTTP ${response.status}`));
          scheduleReconnect();
          return;
        }

        reconnectDelay = RECONNECT_INITIAL_DELAY_MS;
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
        scheduleReconnect();
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          onError?.(e as Error);
          scheduleReconnect();
        }
      }
    };

    connect();

    return {
      close: () => {
        closed = true;
        if (reconnectTimer !== null) clearTimeout(reconnectTimer);
        controller?.abort();
      },
    };
  },
};
