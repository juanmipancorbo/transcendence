import { RawData } from "ws";
import { ByteReader } from "../stream-utils/reader";
import { CloseCodes, getSocksById, Socket } from "../socket";
import { createGameSession, SESSIONS } from "../session";
import gameHandler from "./game-handler";
import { buildDuelRequest, buildError, buildFriendChatMessage, buildFriendRequest, buildGameFatalError, buildInfoMessage, buildMatchFound } from "../protocol-utils";
import { acceptFriendRequest, areFriends, declineFriendRequest, sendFriendRequest } from "@databaseAccess/friend/service";
import { UUID } from "node:crypto";
import { addChatMessage } from "@databaseAccess/chat/service";
import { getUserCurrentGame } from "@databaseAccess/user/repository";
import { DuelRequestsManager } from "../duel-utils";

export enum Protocol {
	KeepAlive = 0,
	JoinCasualQueue = 1,
	LeaveQueue = 2,
	FriendReqSend = 3,
	FriendReqReject = 4,
	FriendReqAccept = 5,
	Chat = 6,
	JoinGame = 7,
	MatchFound = 8,
	DuelRequest = 9,
	DuelAccept = 10,
	Info = 11,
	Error = 12,
	Notification = 13,
	DuelReject = 14
}

export enum ProtocolCodes {
	Generic = 0,
	FriendReqFailed = 1,
	QueueFailed = 2,
	DuelRequestFailed = 3,
}

export let waiting: Socket | null = null;

const duelsManager = new DuelRequestsManager();

export function unsetQuickplay() {
	waiting = null;
}

function onKeepAlive(_: ByteReader, conn: Socket) {
	conn.onKeepAlive();
}

function onQueueCasual(_: ByteReader, conn: Socket) {
	if (duelsManager.hasSentRequest(conn.id))
		return conn.send(buildError("Wait until duel request expires", ProtocolCodes.QueueFailed));
	getUserCurrentGame(conn.id).then(currentGame => {
		if (currentGame !== null)
			return conn.send(buildError("You can't join a queue while you are in a game", ProtocolCodes.QueueFailed));
		conn.status = "busy";
		if (!waiting) {
			waiting = conn;
			return;
		} else if (waiting.id === conn.id)
			return conn.send(buildError("You are already in queue", ProtocolCodes.QueueFailed));
		const game = createGameSession(waiting.id, conn.id, true /* TODO: Maybe take into account user settings */, false, 180);
		const tmp = waiting;
		waiting = null;
		tmp.send(buildMatchFound(game, conn.id));
		conn.send(buildMatchFound(game, tmp.id));
	}).catch(_ => conn.send(buildError("Failed to check current game state", ProtocolCodes.QueueFailed)));
}

function onQueueLeave(_: ByteReader, conn: Socket) {
	if (waiting && waiting.id === conn.id)
		waiting = null;
	else conn.send(buildError("You are not in any queue"));
}

function onFriendRequestSend(p: ByteReader, conn: Socket) {
	const to = p.readPrefixedUTF();
	sendFriendRequest(conn.id, to).then(() => {
		conn.send(buildInfoMessage("Friend request sent"));
		
		const online = getSocksById(to as UUID);
		if (online) {
			const req = buildFriendRequest(conn.id);
			for (const client of online) {
				if (client.status === "online")
					client.send(req);
			}
		}
	}).catch(e => conn.send(buildError(`Failed to send friend request: ${e.message}`, ProtocolCodes.FriendReqFailed)));
}

function onFriendRequestReject(p: ByteReader, conn: Socket) {
	const sender = p.readPrefixedUTF();
	declineFriendRequest(conn.id, sender).then(() => {
		conn.send(buildInfoMessage("Friend request declined"));

		const online = getSocksById(sender as UUID);
		if (online) {
			for (const client of online) {
				if (client.status === "online")
					client.send(buildInfoMessage("Your friend request got rejected"));
			}
		}
	}).catch(e => {
		conn.send(buildError(`Failed to decline request: ${e.message}`));
	});
}

function onFriendRequestAccept(p: ByteReader, conn: Socket) {
	const sender = p.readPrefixedUTF();
	acceptFriendRequest(conn.id, sender).then(() => {
		conn.send(buildInfoMessage("Friend request accepted"));

		const online = getSocksById(sender as UUID);
		if (online) {
			const notice = buildInfoMessage("Your friend request was accepted!");
			for (const client of online) {
				if (client.status === "online")
					client.send(notice);
			}
		}
	}).catch(e => {
		conn.send(buildError(`Failed to accept request: ${e.message}`));
	});
}

function onDuelRequest(p: ByteReader, conn: Socket) {
	const receiver = p.readPrefixedUTF();
	const clients = getSocksById(receiver as UUID);
	if (!clients)
		return conn.send(buildError("User is not online", ProtocolCodes.DuelRequestFailed));

	if (waiting && (waiting.id === conn.id || waiting.id === receiver))
		return conn.send(buildError("Leave the queue or tell your friend to leave the queue first", ProtocolCodes.DuelRequestFailed));

	Promise.all([
		areFriends(conn.id, receiver),
		getUserCurrentGame(conn.id),
		getUserCurrentGame(receiver),
	]).then(data => {
		const [areActuallyfriends, senderGame, receiverGame] = data;
		if (!areActuallyfriends)
			return conn.send(buildError("This user is not your friend", ProtocolCodes.DuelRequestFailed));
		if (senderGame || receiverGame)
			return conn.send(buildError("Either you or your friend is already in a game.", ProtocolCodes.DuelRequestFailed));

		const allowSpectators = p.readBool();
		const timeLimit = p.readInt32(); // In seconds, -1 for unlimited
		if (duelsManager.sendRequest(conn.id, receiver, { allowSpectators, timeLimit })) {
			conn.send(buildInfoMessage("Duel request sent!"));
			const data = buildDuelRequest(conn.id, { allowSpectators, timeLimit });

			for (const client of clients)
				client.send(data);
		} else conn.send(buildError("You already sent a duel request", ProtocolCodes.DuelRequestFailed));
	}).catch(e => {
		console.error(e);
		conn.send(buildError("Error processing request", ProtocolCodes.DuelRequestFailed));
	});
}

function onDuelAccept(p: ByteReader, conn: Socket) {
	getUserCurrentGame(conn.id).then(currentGame => {
		if (currentGame)
			return conn.send(buildError("You are already in a game"));
		const sender = p.readPrefixedUTF();
		const settings = duelsManager.acceptRequest(conn.id, sender);

		if (settings) {
			if (waiting && waiting.id === conn.id) waiting = null;
			const clients = getSocksById(sender as UUID);
			if (!clients || clients.size === 0)
				return conn.send(buildError("The user who sent the request is no longer online"));
			const game = createGameSession(sender as UUID, conn.id, settings.allowSpectators, true, settings.timeLimit);
			conn.send(buildMatchFound(game, sender as UUID));

			const message = buildInfoMessage("Your duel request has been accepted");
			const packet = buildMatchFound(game, conn.id);
			clients.forEach(c => {
				c.send(message);
				c.send(packet);
			});
		} else conn.send(buildError("No such duel request"));
	}).catch(e => {
		console.error(e);
		conn.send(buildError("Error processing request"));
	});
}

function onDuelReject(p: ByteReader, conn: Socket) {
	const sender = p.readPrefixedUTF();
	if (!duelsManager.rejectRequest(conn.id, sender))
		return conn.send(buildError("No such duel request"));

	conn.send(buildInfoMessage("Duel request declined"));
	const clients = getSocksById(sender as UUID);
	clients?.forEach(client => client.send(buildInfoMessage("Your duel request was declined")));
}

function onChat(p: ByteReader, conn: Socket) {
	const to = p.readPrefixedUTF();
	const message = p.readPrefixedUTF();
	const connections = getSocksById(to as UUID);

	if (connections && [...connections].some(client => client.status === "busy")) {
		conn.send(buildError("This player is currently in a game"));
		return;
	}

	getUserCurrentGame(to)
		.then(currentGame => {
			if (currentGame !== null) {
				conn.send(buildError("This player is currently in a game"));
				return;
			}
			return addChatMessage(conn.id, to, message).then(() => {
				const online = getSocksById(to as UUID);
				if (!online) return;
				const msg = buildFriendChatMessage(conn.id, message);
				for (const client of online) {
					if (client.status === "online") client.send(msg);
				}
			});
		})
		.catch(e => conn.send(buildError(`Failed to send message: ${e.message}`)));
}

function onJoinGame(p: ByteReader, conn: Socket) {
	const gameId = p.readPrefixedUTF();
	const game = SESSIONS.get(gameId as UUID);
	if (!game) {
		conn.send(buildGameFatalError("Game doesn't exist"));
		return;
	}

	const isQueuedPlayer = game.whitePlayer.id === conn.id || game.blackPlayer.id === conn.id;
	if (conn.status === "busy" && !isQueuedPlayer) {
		conn.send(buildGameFatalError("Cannot join a game while in queue"));
		return;
	}

	conn.handler = gameHandler;
	conn.status = "busy";

	try { game.joinGame(conn); } catch (e: any) {
		conn.restoreGlobalState();
		conn.send(buildGameFatalError(e.message));
	}
}

const callbacks: Array<(read: ByteReader, sock: Socket) => void> = [];

callbacks[Protocol.KeepAlive] = onKeepAlive;
callbacks[Protocol.JoinCasualQueue] = onQueueCasual;
callbacks[Protocol.LeaveQueue] = onQueueLeave;
callbacks[Protocol.FriendReqSend] = onFriendRequestSend;
callbacks[Protocol.FriendReqReject] = onFriendRequestReject;
callbacks[Protocol.FriendReqAccept] = onFriendRequestAccept;
callbacks[Protocol.DuelRequest] = onDuelRequest;
callbacks[Protocol.DuelAccept] = onDuelAccept;
callbacks[Protocol.DuelReject] = onDuelReject;
callbacks[Protocol.Chat] = onChat;
callbacks[Protocol.JoinGame] = onJoinGame;

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
