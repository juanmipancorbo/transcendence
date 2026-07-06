import { Board, CellState, GlobalProtocol, Protocol } from "@/types";

export class ByteWriter {
	private dv: DataView;
	private u8: Uint8Array;
	private offset = 0;

	constructor(size = 50) {
		this.u8 = new Uint8Array(size);
		this.dv = new DataView(this.u8.buffer);
	}

	private ensureCapacity(size: number) {
		if (this.u8.byteLength - this.offset >= size) return;
		const newSize = Math.max(this.u8.byteLength * 2, this.offset + size);
		const next = new Uint8Array(newSize);
		next.set(this.u8);
		this.u8 = next;
		this.dv = new DataView(next.buffer);
	}

	writeUint8(n: number): ByteWriter {
		this.ensureCapacity(1);
		this.dv.setUint8(this.offset++, n);
		return this;
	}

	writeBool(b: boolean): ByteWriter {
		return this.writeUint8(b ? 1 : 0);
	}

	writeInt32(n: number): ByteWriter {
		this.ensureCapacity(4);
		this.dv.setInt32(this.offset, n, false); // big-endian
		this.offset += 4;
		return this;
	}

	writeUint32(n: number): ByteWriter {
		this.ensureCapacity(4);
		this.dv.setUint32(this.offset, n, false);
		this.offset += 4;
		return this;
	}

	writePrefixedUTF(s: string): ByteWriter {
		const encoded = new TextEncoder().encode(s);
		this.ensureCapacity(4 + encoded.byteLength);
		this.dv.setUint32(this.offset, encoded.byteLength, false); // byte length, not char length
		this.offset += 4;
		this.u8.set(encoded, this.offset);
		this.offset += encoded.byteLength;
		return this;
	}

	writeBoard(board: Board): ByteWriter {
		if (board.length < 1 || board[0].length < 1) {
			this.writeUint32(0);
			this.writeUint32(0);
			return this;
		}
		const height = board.length;
		const width = board[0].length;
		this.writeUint32(height);
		this.writeUint32(width);
		for (let i = 0; i < height; i++)
			for (let j = 0; j < width; j++)
				this.writeUint8(board[i][j]);
		return this;
	}

	freeze(): Uint8Array {
		return this.u8.subarray(0, this.offset);
	}
}

export class ByteReader {
    private dv: DataView;
    private u8: Uint8Array;
    private offset = 0;

    constructor(data: ArrayBuffer | Uint8Array) {
        this.u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
        this.dv = new DataView(this.u8.buffer, this.u8.byteOffset, this.u8.byteLength);
    }

    get remaining() { return this.u8.byteLength - this.offset; }

    readUint8(): number  { return this.dv.getUint8(this.offset++); }
    readBool(): boolean  { return this.readUint8() !== 0; }
    readInt32(): number  { const n = this.dv.getInt32(this.offset);  this.offset += 4; return n; }
    readUint32(): number { const n = this.dv.getUint32(this.offset); this.offset += 4; return n; }

    readPrefixedUTF(): string {
        const length = this.readUint32();
        const bytes = this.u8.subarray(this.offset, this.offset + length);
        this.offset += length;
        return new TextDecoder().decode(bytes);
    }

    readBoard(): Board {
        const height = this.readUint32();
        const width = this.readUint32();
        const board: Board = [];
        for (let i = 0; i < height; i++) {
            board.push([]);
            for (let j = 0; j < width; j++)
                board[i].push(this.readUint8() as CellState);
        }
        return board;
    }
}

export function build(id: number): ByteWriter {
	return new ByteWriter().writeUint8(id);
}

// ----- Game -----

export function buildReadyToGame(): Uint8Array {
	return build(Protocol.Ready).freeze();
}

export function buildConsumeTurn(row: number, col: number): Uint8Array {
	return build(Protocol.ConsumeTurn)
		.writeUint8(row)
		.writeUint8(col)
		.freeze();
}

export function buildChat(message: string): Uint8Array {
	return build(Protocol.ChatMessage)
		.writePrefixedUTF(message)
		.freeze();
}

export function buildAbandon(): Uint8Array {
	return build(Protocol.Abandon).freeze();
}

export function buildDisconnect(): Uint8Array {
	return build(Protocol.Disconnect).freeze();
}

// ----- Global -----

export function buildJoinQueue(): Uint8Array {
	return build(GlobalProtocol.JoinCasualQueue).freeze();
}

export function buildLeaveQueue(): Uint8Array {
	return build(GlobalProtocol.LeaveQueue).freeze();
}

export function buildFriendRequest(receiverId: string): Uint8Array {
	return build(GlobalProtocol.FriendReqSend)
		.writePrefixedUTF(receiverId)
		.freeze();
}

export function buildFriendRequestReject(senderId: string): Uint8Array {
	return build(GlobalProtocol.FriendReqReject)
		.writePrefixedUTF(senderId)
		.freeze();
}

export function buildFriendChat(to: string, message: string): Uint8Array {
	return build(GlobalProtocol.Chat)
		.writePrefixedUTF(to)
		.writePrefixedUTF(message)
		.freeze();
}

export function buildJoinGame(gameId: string): Uint8Array {
	return build(GlobalProtocol.JoinGame)
		.writePrefixedUTF(gameId)
		.freeze();
}
