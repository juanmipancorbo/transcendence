"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ByteReader = void 0;
function toBuffer(data) {
    if (Buffer.isBuffer(data))
        return data;
    if (data instanceof ArrayBuffer)
        return Buffer.from(data);
    return Buffer.concat(data);
}
class ByteReader {
    constructor(data) {
        this.offset = 0;
        this.buf = toBuffer(data);
    }
    get remaining() { return this.buf.length - this.offset; }
    readUint8() {
        if (this.remaining < 1)
            throw new Error("Not enough bytes left to read");
        return this.buf.readUint8(this.offset++);
    }
    readBool() {
        return this.readUint8() != 0;
    }
    readInt32() {
        if (this.remaining < 4)
            throw new Error("Not enough bytes left to read");
        const res = this.buf.readInt32BE(this.offset);
        this.offset += 4;
        return res;
    }
    readUint32() {
        if (this.remaining < 4)
            throw new Error("Not enough bytes left to read");
        const res = this.buf.readUint32BE(this.offset);
        this.offset += 4;
        return res;
    }
    readPrefixedUTF() {
        const length = this.readUint32();
        if (this.remaining < length)
            throw new Error("Not enough bytes left to read");
        const bytes = this.buf.subarray(this.offset, this.offset + length);
        this.offset += length;
        return bytes.toString("utf8");
    }
    readBoard() {
        const board = [];
        const height = this.readUint32();
        const width = this.readUint32();
        if (this.remaining < height * width)
            throw new Error("Not enough bytes left to read");
        for (let i = 0; i < height; ++i) {
            board.push([]);
            for (let j = 0; j < width; ++j)
                board[i].push(this.readUint8());
        }
        return board;
    }
}
exports.ByteReader = ByteReader;
