/**
 * WEBSOCKET STUB
 * ──────────────────────────────────────────────────────────────────────────
 * Placeholder for the real WebSocket game client.
 * The person in charge of real-time game sync should implement this.
 */

export class GameSocket {
  connect(): Promise<void> {
    console.log("[GameSocket] stub — not connected");
    return Promise.resolve();
  }

  disconnect(): void {}

  send(_type: string, _payload?: unknown): void {}

  on(_type: string, _listener: (_payload: unknown) => void): () => void {
    return () => {};
  }

  get isConnected(): boolean {
    return false;
  }
}
