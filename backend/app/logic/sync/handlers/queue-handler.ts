import { RawData } from "ws";
import { ByteReader } from "../stream-utils/reader";
import { Socket } from "../socket";

export enum Protocol {
	KeepAlive = 0,
	MatchFound = 1,
	MatchmakeError = 2
}

export default function handler(data: RawData, conn: Socket) {
	const reader = new ByteReader(data);
	const typeId = reader.readUint8();

	if (typeId === Protocol.KeepAlive)
		conn.onKeepAlive();
}
