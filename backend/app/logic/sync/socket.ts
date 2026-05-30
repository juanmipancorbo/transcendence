import { UUID } from "node:crypto";
import { type SessionPlayer } from "./session";
import { WebSocket } from "ws";
import { RawData } from "ws";
import { MessageEvent } from "ws";
import { Protocol as GameProtocol } from "./handlers/game-handler";

function handle(e: MessageEvent, sock: Socket) {
	if (sock.handler)
		sock.handler(e.data as RawData, sock);
}

export class Socket {
	lastKeepAlive: number;
	pollTimeout?: NodeJS.Timeout;
	id: UUID;
	player?: SessionPlayer; // Only set if the user is in a game, to avoid map lookups
	ws: WebSocket;
	handler?: (data: RawData, conn: Socket) => void;

	constructor(id: UUID, sock: WebSocket) {
		this.id = id;
		this.ws = sock;
		this.lastKeepAlive = Date.now();
		this.resetTimeout();
		this.setup();
	}

	private setup() {
		this.ws.onmessage = (e) => handle(e, this);
		this.ws.onclose = (e) => {
			if (this.player) {
				if (e.code === GameProtocol.PlayerAbandon)
					this.player.game.playerAbandon(this);
				else this.player.game.playerDisconnect(this);
			}
		}

		this.ws.onerror = (e) => {
			console.error("Client was disconnected with an error: " + e.message);
			if (this.player)
				this.player.game.playerDisconnect(this);
		}
	}

	private resetTimeout() {
		clearTimeout(this.pollTimeout);
		this.pollTimeout = setTimeout(() => {
			if (this.player)
				this.player.game.playerDisconnect(this);
			this.ws.close();
		}, 20000);
	}

	close(code?: number, msg?: string) {
		this.ws.close(code ?? 0, msg);
	}

	send(data: BufferSource) {
		if (this.ws.readyState === WebSocket.OPEN)
			this.ws.send(data);
	}

	onKeepAlive() {
		this.lastKeepAlive = Date.now();
		this.resetTimeout();
	}

	isConnectionAlive(): boolean {
		return Date.now() - this.lastKeepAlive < 20000; // Connection is considered dead after 20 seconds
	}
}
