import { RawData } from "ws";
import { ByteReader } from "../stream-utils/reader";
import { CloseCodes, Socket } from "../socket";
import { createGameSession } from "../session";
import gameHandler from "./game-handler";
import { buildError, buildMatchFound } from "../protocol-utils";

export enum Protocol {
	KeepAlive = 0,
	JoinCasualQueue = 1,
	JoinRankedQueue = 2, // TODO: Implement
	LeaveQueue = 3,
	MatchFound = 4,
	Error = 5
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

const callbacks: Array<(read: ByteReader, sock: Socket) => void> = [];

callbacks[Protocol.KeepAlive] = onKeepAlive;
callbacks[Protocol.JoinCasualQueue] = onQueueCasual;
callbacks[Protocol.JoinRankedQueue] = onQueueRanked;
callbacks[Protocol.LeaveQueue] = onQueueLeave;

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
