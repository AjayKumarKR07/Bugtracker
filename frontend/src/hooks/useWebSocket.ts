import { useEffect, useRef, useState } from 'react';
import type { WebSocketNotificationEvent } from '../types/notification';

export type WebSocketStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  token: string | null;
  onMessage?: (event: WebSocketNotificationEvent) => void;
  enabled?: boolean;
}

export function useWebSocket({ token, onMessage, enabled = true }: UseWebSocketOptions) {
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const onMessageRef = useRef(onMessage);

  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setStatus('disconnected');
      return;
    }

    let isMounted = true;

    function getWsUrl(): string {
      const explicitWsBase = import.meta.env.VITE_WS_BASE_URL;
      if (explicitWsBase) {
        return `${explicitWsBase}/ws/notifications?token=${encodeURIComponent(token!)}`;
      }
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
      const wsProto = apiBase.startsWith('https') ? 'wss' : 'ws';
      const cleanHost = apiBase.replace(/^https?:\/\//, '');
      return `${wsProto}://${cleanHost}/ws/notifications?token=${encodeURIComponent(token!)}`;
    }

    function connect() {
      if (!isMounted || !token) return;

      try {
        setStatus('connecting');
        const url = getWsUrl();
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setStatus('connected');
          reconnectAttemptRef.current = 0;
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data) as WebSocketNotificationEvent;
            if (data && data.type === 'notification') {
              onMessageRef.current?.(data);
            }
          } catch {
            // Non-JSON frame (e.g. keepalive/ping), ignore
          }
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setStatus('error');
        };

        ws.onclose = (event) => {
          if (!isMounted) return;
          setStatus('disconnected');
          wsRef.current = null;

          // Do not reconnect if rejected due to 4001 (unauthorized) or 4003 (forbidden)
          if (event.code === 4001 || event.code === 4003) {
            if (event.code === 4001) {
              window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            }
            return;
          }

          // Exponential backoff reconnect
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
          reconnectAttemptRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, delay);
        };
      } catch {
        if (isMounted) {
          setStatus('error');
        }
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        const socket = wsRef.current;
        wsRef.current = null;
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        try {
          socket.close();
        } catch {
          // Ignore close errors during unmount
        }
      }
    };
  }, [token, enabled]);

  return { status };
}
