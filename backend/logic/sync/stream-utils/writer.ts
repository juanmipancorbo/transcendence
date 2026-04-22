export class ByteWriter {
	private buf: Buffer;
	private offset = 0;

	constructor(size: number) {
		this.buf = Buffer.allocUnsafe(size);
	}

	private ensureCapacity(size: number) {
		if (this.buf.byteLength - this.offset < size)
			this.buf = Buffer.concat([this.buf, Buffer.allocUnsafe(Math.max(this.buf.byteLength * 2, this.offset + size))]);
	}

	writeUint8(n: number) {
		this.ensureCapacity(1);
		this.buf.writeUint8(n, this.offset++);
	}

	writeBool(b: boolean) {
		this.writeUint8(b ? 1 : 0);
	}

	writeInt32(n: number) {
		this.ensureCapacity(4);
		this.buf.writeInt32BE(n, this.offset)
		this.offset += 4;
	}

	writeUint32(n: number) {
		this.ensureCapacity(4);
		this.buf.writeUint32BE(n, this.offset)
		this.offset += 4;
	}

	writePrefixedUTF(s: string) {
		this.ensureCapacity(4 + Buffer.byteLength(s, "utf8"));
		this.buf.writeUint32BE(s.length, this.offset);
		this.offset += 4;
		this.offset += this.buf.write(s, this.offset, "utf8");
	}
}
