import { Protocol } from "@/types";
import { build, ByteReader, ByteWriter } from "./stream-utils";
import { useRouter } from "next/navigation";

export enum CloseCodes {
	Error = 4444,
}

export class GameSocket {
	private ws: WebSocket;
	private token: string;
	handlers: ((p: ByteReader) => void)[] = [];
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
				const router = useRouter();
				console.log(e);
				this.ws.onclose = () => {}; // Avoid ondisconnect being called twice
				if (this.ondisconnect)
					this.ondisconnect(new Error(`${e}`));
				router.refresh();
			};
			this.ws.onclose = e => {
				const router = useRouter();
				console.log(e);
				if (this.ondisconnect)
					this.ondisconnect(e.code === CloseCodes.Error ? new Error(e.reason) : undefined);
				router.refresh();
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

	disconnect(code: number): void {
		this.ws.close(code);
	}

	send(payload: Uint8Array): void {
		if (this.isConnected) this.ws.send(payload);
	}

	get isConnected(): boolean {
		return this.ws.readyState === WebSocket.OPEN;
	}
}
