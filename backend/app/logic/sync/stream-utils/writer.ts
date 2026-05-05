import { Board } from "../../game";

export class ByteWriter {
	private buf: Buffer;
	private offset = 0;

	constructor(size = 50) {
		this.buf = Buffer.allocUnsafe(size);
	}

	private ensureCapacity(size: number) {
		if (this.buf.byteLength - this.offset < size)
			this.buf = Buffer.concat([this.buf, Buffer.allocUnsafe(Math.max(this.buf.byteLength * 2, this.offset + size))]);
	}

	writeUint8(n: number): ByteWriter {
		this.ensureCapacity(1);
		this.buf.writeUint8(n, this.offset++);
		return this;
	}

	writeBool(b: boolean): ByteWriter {
		this.writeUint8(b ? 1 : 0);
		return this;
	}

	writeInt32(n: number): ByteWriter {
		this.ensureCapacity(4);
		this.buf.writeInt32BE(n, this.offset)
		this.offset += 4;
		return this;
	}

	writeUint32(n: number): ByteWriter {
		this.ensureCapacity(4);
		this.buf.writeUint32BE(n, this.offset)
		this.offset += 4;
		return this;
	}

	writePrefixedUTF(s: string): ByteWriter {
		this.ensureCapacity(4 + Buffer.byteLength(s, "utf8"));
		this.buf.writeUint32BE(s.length, this.offset);
		this.offset += 4;
		this.offset += this.buf.write(s, this.offset, "utf8");
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

		for (let i = 0; i < height; ++i)
			for (let j = 0; j < width; ++j)
				this.writeUint8(board[i][j]);

		return this;
	}

	freeze(): BufferSource {
		return this.buf.subarray(0, this.offset) as unknown as BufferSource;
	}
}
