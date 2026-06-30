import { Protocol } from "@/types";
import { build, ByteReader, ByteWriter } from "./stream-utils";

export enum CloseCodes {
	Error = 4444,
}

export class GameSocket {
	private ws: WebSocket;
	private handlers: ((p: ByteReader) => void)[] = [];
	private token: string;
	url: string;
	ondisconnect?: (e?: Error) => void;

	constructor(url: string, token: string, onConnect: (e?: Error) => void) {
		this.ws = new WebSocket(url);
		this.token = token;
		this.ws.binaryType = "arraybuffer";
		this.url = url;
		this.setup(onConnect);
	}

	private setup(onConnect: (e?: Error) => void) {
		this.ws.onerror = e => onConnect(new Error(`${e}`));
		this.ws.onopen = _ => {
			this.ws.onerror = e => {
				this.ws.onclose = () => {}; // Avoid ondisconnect being called twice
				if (this.ondisconnect)
					this.ondisconnect(new Error(`${e}`));
			};
			this.ws.onclose = e => {
				console.log(e);
				if (this.ondisconnect)
					this.ondisconnect(e.code === CloseCodes.Error ? new Error(e.reason) : undefined);
			}
			this.send(new ByteWriter(60).writeUint8(0).writePrefixedUTF(this.token).freeze()); // Authenticate
			onConnect();

			// Keep alive
			const interval = window.setInterval(() => {
				if (!this.isConnected) {
					window.clearInterval(interval);
					return;
				}
				this.send(build(Protocol.KeepAlive).freeze());
			}, 10000);
		}
		this.ws.onmessage = e => {
			const reader = new ByteReader(e.data);
			const typeId = reader.readUint8();
			if (this.handlers[typeId])
				this.handlers[typeId](reader);
		}
	}

	setupGlobal(): void {

	}

	disconnect(code: number): void {
		this.ws.onclose = () => {}; // Avoid ondisconnect being called twice just in case
		this.ws.close(code);
		if (this.ondisconnect)
			this.ondisconnect();
	}

	send(payload: Uint8Array): void {
		if (this.isConnected) this.ws.send(payload);
	}

	on(typeId: number, listener: (payload: ByteReader) => void) {
		this.handlers[typeId] = listener;
	}

	get isConnected(): boolean {
		return this.ws.readyState === WebSocket.OPEN;
	}
}
