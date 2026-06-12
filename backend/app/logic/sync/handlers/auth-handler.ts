import { RawData } from "ws";
import { ByteReader } from "../stream-utils/reader";
import { Socket } from "../socket";
import { tokenUtils } from "@utils/jwt-utils";
import { UUID } from "crypto";
import { CloseCodes } from "../socket";

export enum Protocol {
	Token = 0
}

export default function onAuth(data: RawData, conn: Socket, callback: () => void) {
	const reader = new ByteReader(data);
	const typeId = reader.readUint8();

	if (typeId !== Protocol.Token)
		conn.close(CloseCodes.Error, "Failed to authenticate");

	const token = reader.readPrefixedUTF();
	try {
		const payload = tokenUtils.verifyAccessToken(token);
		conn.id = payload.id as UUID;
		conn.authenticated = true;
		callback();
	} catch (e: any) { conn.close(CloseCodes.Error, `Invalid or expired token`); }
}
