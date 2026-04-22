import { RawData } from "ws";

function toBuffer(data: RawData): Buffer {
	if (Buffer.isBuffer(data)) return data;
	if (data instanceof ArrayBuffer) return Buffer.from(data);
	return Buffer.concat(data);
}

export class ByteReader {
	private buf: Buffer;
	private offset = 0;

	constructor(data: RawData) {
		this.buf = toBuffer(data);
	}

	get remaining() { return this.buf.length - this.offset; }

	readUint8(): number {
		return this.buf.readUint8(this.offset++);
	}

	readBool(): boolean {
		return this.readUint8() != 0;
	}

	readInt32(): number {
		const res = this.buf.readInt32BE(this.offset);
		this.offset += 4;

		return res;
	}

	readUint32(): number {
		const res = this.buf.readUint32BE(this.offset);
		this.offset += 4;

		return res;
	}

	readPrefixedUTF(): string {
		const length = this.readUint32();
		const bytes = this.buf.subarray(this.offset, this.offset + length);

		return bytes.toString("utf8");
	}
}
