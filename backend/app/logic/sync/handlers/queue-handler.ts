import { RawData } from "ws";
import { ByteReader } from "../stream-utils/reader";
import { CloseCodes, Socket } from "../socket";

export enum Protocol {
	KeepAlive = 0,
	MatchFound = 1,
	MatchmakeError = 2
}

export default function handler(data: RawData, conn: Socket) {
	const reader = new ByteReader(data);
	try {
		const typeId = reader.readUint8();

		if (typeId === Protocol.KeepAlive)
			conn.onKeepAlive();
	} catch (_) {
		conn.close(CloseCodes.Error, "Invalid payload, use the protocol correctly and try again");
	}
}
