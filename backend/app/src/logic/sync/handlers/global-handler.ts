import { RawData } from "ws";
import { ByteReader } from "../stream-utils/reader";
import { CloseCodes, getSocksById, Socket } from "../socket";
import { createGameSession } from "../session";
import gameHandler from "./game-handler";
import { buildError, buildFriendRequest, buildInfoMessage, buildMatchFound } from "../protocol-utils";
import { sendFriendRequest } from "@databaseAccess/friend/service";
import { UUID } from "node:crypto";

export enum Protocol {
	KeepAlive = 0,
	JoinCasualQueue = 1,
	JoinRankedQueue = 2, // TODO: Implement
	LeaveQueue = 3,
	FriendReqSend = 4,
	FriendReqReject = 5,
	FriendReqAccept = 6,
	MatchFound = 7,
	Info = 8,
	Error = 9,
	Notification = 10
}

export enum ProtocolCodes {
	Generic = 0,
	FriendReqFailed = 1,

}

export let waiting: Socket | null = null;

export function unsetQuickplay() {
	waiting = null;
}

function onKeepAlive(_: ByteReader, conn: Socket) {
	conn.onKeepAlive();
}

function onQueueCasual(_: ByteReader, conn: Socket) {
	conn.status = "busy";
	if (!waiting) {
		waiting = conn;
		return;
	} else if (waiting.id === conn.id)
		return conn.close(CloseCodes.Error, "You are already in queue");
	const game = createGameSession(waiting.id, conn.id, false /* TODO: Maybe take into account user settings */, false, 100);
	const tmp = waiting;
	waiting = null;
	tmp.send(buildMatchFound(game, conn.id));
	conn.send(buildMatchFound(game, tmp.id));
	const res = game.joinGame(conn);
	if (res instanceof Error) {
		conn.send(buildError(`Failed to join game: ${res.message}`));
		return;
	}
	conn.handler = gameHandler;

	const resOther = game.joinGame(tmp);
	if (resOther instanceof Error) {
		tmp.send(buildError(`Failed to join game: ${resOther.message}`));
		return;
	}
	tmp.handler = gameHandler;
}

function onQueueRanked(_: ByteReader, conn: Socket) {
	// TODO
}

function onQueueLeave(_: ByteReader, conn: Socket) {
	if (waiting && waiting.id === conn.id)
		waiting = null;
	/*else if (false) TODO: ranked queue leave*/
	else conn.send(buildError("You are not in any queue"));
}

function onFriendRequestSend(p: ByteReader, conn: Socket) {
	const to = p.readPrefixedUTF();
	sendFriendRequest(conn.id, to).then(() => {
		conn.send(buildInfoMessage("Friend request sent"));
		
		const online = getSocksById(to as UUID);
		if (online) {
			for (const client of online) {
				if (client.status === "online")
					client.send(buildFriendRequest(conn.id));
			}
		}
	}).catch(e => conn.send(buildError(`Failed to send friend request: ${e.message}`, ProtocolCodes.FriendReqFailed)));
}

function onFriendRequestReject(p: ByteReader, conn: Socket) {
	
}

const callbacks: Array<(read: ByteReader, sock: Socket) => void> = [];

callbacks[Protocol.KeepAlive] = onKeepAlive;
callbacks[Protocol.JoinCasualQueue] = onQueueCasual;
callbacks[Protocol.JoinRankedQueue] = onQueueRanked;
callbacks[Protocol.LeaveQueue] = onQueueLeave;
callbacks[Protocol.FriendReqSend] = onFriendRequestSend;

export default function handler(data: RawData, conn: Socket) {
	const reader = new ByteReader(data);
	try {
		const typeId = reader.readUint8();

		if (callbacks[typeId])
			callbacks[typeId](reader, conn);
	} catch (_) {
		conn.close(CloseCodes.Error, "Invalid payload, use the protocol correctly and try again");
	}
}
