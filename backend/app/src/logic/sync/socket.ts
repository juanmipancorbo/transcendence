import { randomUUID, UUID } from "node:crypto";
import { type SessionPlayer } from "./session";
import { WebSocket, RawData, MessageEvent } from "ws";
import { PublicUser } from "@endpoints/users-response";
import { unsetQuickplay, waiting } from "./handlers/global-handler";

export enum CloseCodes {
	Error = 4444,
}

function handle(e: MessageEvent, sock: Socket) {
	if (sock.handler)
		sock.handler(e.data as RawData, sock);
}

const connectedUsers = new Map<UUID, Set<Socket>>();

export function registerSocket(sock: Socket) {
	const set = connectedUsers.get(sock.id);
	if (set) {
		set.add(sock);
	} else {
		const newSet = new Set<Socket>();
		newSet.add(sock);
		connectedUsers.set(sock.id, newSet);
	}
}

export function unregisterSocket(sock: Socket) {
	const sockSet = getSocksById(sock.id);
	if (!sockSet)
		return;

	sockSet.delete(sock);
	if (sockSet.size === 0)
		connectedUsers.delete(sock.id);
}

export function getSocksById(id: UUID): Set<Socket> | undefined { return connectedUsers.get(id); }

export function injectStatus(...users: PublicUser[]) {
	for (const user of users) {
		const sock = getSocksById(user.id);
		if (sock) {
			let busy = false;
			for (const client of sock) {
				if (client.status === "busy") {
					busy = true;
					break;
				}
			}
			user.status = busy ? "busy" : "online";
		} else user.status = "offline";
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
				else this.player.game.playerDisconnect(this);
			}
			unregisterSocket(this);
		}

		this.ws.onerror = (_) => {
			if (waiting && waiting.id === this.id)
				unsetQuickplay();
			if (this.player)
				this.player.game.playerDisconnect(this);
			unregisterSocket(this);
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
