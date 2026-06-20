import { RawData } from "ws";
import { Board, Cell } from "../../game";

function toBuffer(data: RawData): Buffer {
	if (Buffer.isBuffer(data)) return data;
	if (data instanceof ArrayBuffer) return Buffer.from(data);
	return Buffer.concat(data);
}

export class ByteReader {
	private buf: Buffer;
	private offset = 0;

	constructor(data: RawData | Buffer) {
		this.buf = toBuffer(data);
	}

	get remaining() { return this.buf.length - this.offset; }

	readUint8(): number {
		if (this.remaining < 1)
			throw new Error("Not enough bytes left to read");
		return this.buf.readUint8(this.offset++);
	}

	readBool(): boolean {
		return this.readUint8() != 0;
	}

	readInt32(): number {
		if (this.remaining < 4)
			throw new Error("Not enough bytes left to read");
		const res = this.buf.readInt32BE(this.offset);
		this.offset += 4;

		return res;
	}

	readUint32(): number {
		if (this.remaining < 4)
			throw new Error("Not enough bytes left to read");
		const res = this.buf.readUint32BE(this.offset);
		this.offset += 4;

		return res;
	}

	readPrefixedUTF(): string {
		const length = this.readUint32();
		if (this.remaining < length)
			throw new Error("Not enough bytes left to read");
		const bytes = this.buf.subarray(this.offset, this.offset + length);
		this.offset += length;

		return bytes.toString("utf8");
	}

	readBoard(): Board {
		const board: Board = [];
		const height = this.readUint32();
		const width = this.readUint32();
		if (this.remaining < height * width)
			throw new Error("Not enough bytes left to read");

		for (let i = 0; i < height; ++i) {
			board.push([]);
			for (let j = 0; j < width; ++j)
				board[i].push(this.readUint8() as Cell);
		}

		return board;
	}
}
