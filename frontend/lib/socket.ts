/**
 * Velocity Noir – WebSocket client
 * Wraps the native WebSocket with typed message dispatch and auto-reconnect.
 */

import type { WSMessage, WSMessageType } from "@/types";

type Listener<T = unknown> = (payload: T) => void;

export class GameSocket {
  private ws: WebSocket | null = null;
  private listeners = new Map<WSMessageType, Set<Listener>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly url: string, private readonly getToken: () => string | null) {}

  // ─── Connect ───────────────────────────────────────────────────────────────
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const token = this.getToken();
      const wsUrl = token ? `${this.url}?token=${token}` : this.url;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.startPing();
        resolve();
      };

      this.ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage;
          this.dispatch(msg.type, msg.payload);
        } catch {
          // malformed message — ignore
        }
      };

      this.ws.onclose = () => {
        this.stopPing();
        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => this.connect(), 3000);
        }
      };

      this.ws.onerror = (err) => {
        reject(err);
      };
    });
  }

  // ─── Disconnect ────────────────────────────────────────────────────────────
  disconnect(): void {
    this.shouldReconnect = false;
    this.stopPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  // ─── Send ──────────────────────────────────────────────────────────────────
  send<T>(type: WSMessageType, payload?: T): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn("[GameSocket] Not connected – message dropped:", type);
      return;
    }
    const msg: WSMessage<T> = { type, payload, timestamp: Date.now() };
    this.ws.send(JSON.stringify(msg));
  }

  // ─── Listeners ─────────────────────────────────────────────────────────────
  on<T>(type: WSMessageType, listener: Listener<T>): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)!.add(listener as Listener);
    // Return unsubscribe function
    return () => this.off(type, listener);
  }

  off<T>(type: WSMessageType, listener: Listener<T>): void {
    this.listeners.get(type)?.delete(listener as Listener);
  }

  private dispatch(type: WSMessageType, payload: unknown): void {
    this.listeners.get(type)?.forEach((fn) => fn(payload));
  }

  // ─── Ping / keepalive ──────────────────────────────────────────────────────
  private startPing(): void {
    this.pingInterval = setInterval(() => this.send("ping"), 20_000);
  }

  private stopPing(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
