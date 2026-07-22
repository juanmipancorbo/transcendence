"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ByteWriter = void 0;
class ByteWriter {
    constructor(size = 50) {
        this.offset = 0;
        this.buf = Buffer.allocUnsafe(size);
    }
    ensureCapacity(size) {
        if (this.buf.byteLength - this.offset < size)
            this.buf = Buffer.concat([this.buf, Buffer.allocUnsafe(Math.max(this.buf.byteLength * 2, this.offset + size))]);
    }
    writeUint8(n) {
        this.ensureCapacity(1);
        this.buf.writeUint8(n, this.offset++);
        return this;
    }
    writeBool(b) {
        this.writeUint8(b ? 1 : 0);
        return this;
    }
    writeInt32(n) {
        this.ensureCapacity(4);
        this.buf.writeInt32BE(n, this.offset);
        this.offset += 4;
        return this;
    }
    writeUint32(n) {
        this.ensureCapacity(4);
        this.buf.writeUint32BE(n, this.offset);
        this.offset += 4;
        return this;
    }
    writePrefixedUTF(s) {
        const byteLength = Buffer.byteLength(s, "utf8");
        this.ensureCapacity(4 + byteLength);
        this.buf.writeUint32BE(byteLength, this.offset);
        this.offset += 4;
        this.offset += this.buf.write(s, this.offset, "utf8");
        return this;
    }
    writeBoard(board) {
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
    freeze() {
        return this.buf.subarray(0, this.offset);
    }
}
exports.ByteWriter = ByteWriter;
