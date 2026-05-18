
export class GameSocket {
  connect(): Promise<void> {
    console.log("[GameSocket] — not connected");
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
