import { ByteReader } from "./stream-utils";

export class GameSocket {
	private ws: WebSocket;
	private handlers: ((p: ByteReader) => void)[] = [];
	ondisconnect?: (e?: Error) => void;

	constructor(url: string, onConnect: (e?: Error) => void) {
		this.ws = new WebSocket(url);
		this.ws.binaryType = "arraybuffer";
		this.setup(onConnect);
	}

	private setup(onConnect: (e?: Error) => void) {
		this.ws.onerror = e => onConnect(new Error(`${e}`));
		this.ws.onopen = _ => {
			this.ws.onerror = e => {
				if (this.ondisconnect)
					this.ondisconnect(new Error(`${e}`));
			};
			onConnect();
		}
		this.ws.onmessage = e => {
			const reader = new ByteReader(e.data);
			const typeId = reader.readUint8();
			if (this.handlers[typeId])
				this.handlers[typeId](reader);
		}
	}

	disconnect(code: number): void {
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
