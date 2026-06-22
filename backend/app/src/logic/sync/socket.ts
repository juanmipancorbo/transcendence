import { randomUUID, UUID } from "node:crypto";
import { type SessionPlayer } from "./session";
import { WebSocket, RawData, MessageEvent } from "ws";
import { unsetQuickplay, waiting } from "../../websockets";
import { PublicUser } from "@endpoints/users-response";

export enum CloseCodes {
	Error = 4444,
}

function handle(e: MessageEvent, sock: Socket) {
	if (sock.handler)
		sock.handler(e.data as RawData, sock);
}

const map = new Map<UUID, Socket>();

export function registerSocket(sock: Socket) { map.set(sock.id, sock); }
export function getSockById(id: UUID): Socket | undefined { return map.get(id); }

export function injectStatus(...users: PublicUser[]) {
	for (const user of users) {
		const sock = getSockById(user.id);
		user.status = sock?.status ?? "offline";
	}
}

export class Socket {
	lastKeepAlive: number;
	pollTimeout?: NodeJS.Timeout;
	id: UUID;
	authenticated: boolean;
	abandonedExplicitly: boolean = false;
	player?: SessionPlayer; // Only set if the user is in a game, to avoid map lookups
	ws: WebSocket;
	status: "offline" | "online" | "busy" = "offline";
	handler?: (data: RawData, conn: Socket) => void;

	constructor(sock: WebSocket) {
		this.id = randomUUID();
		this.authenticated = false;
		this.ws = sock;
		this.lastKeepAlive = Date.now();
		this.resetTimeout();
		this.setup();
	}

	private setup() {
		this.ws.onmessage = (e) => handle(e, this);
		this.ws.onclose = () => {
			if (waiting && waiting.id === this.id)
				unsetQuickplay();
			if (this.player) {
				if (this.abandonedExplicitly)
					this.player.game.playerAbandon(this);
				else
					this.player.game.playerDisconnect(this);
			}
			map.delete(this.id);
		}

		this.ws.onerror = (_) => {
			if (waiting && waiting.id === this.id)
				unsetQuickplay();
			if (this.player)
				this.player.game.playerDisconnect(this);
			map.delete(this.id);
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
		this.ws.close(code, msg);
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
