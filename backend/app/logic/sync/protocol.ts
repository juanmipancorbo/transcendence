import { RawData } from "ws";
import { ByteReader } from "./stream-utils/reader";
import { broadcastToGame, GameConnection, GameSession } from "./session";
import { UUID } from "crypto";
import { buildSpectatorLeave } from "./protocol-utils";
import { abandonGame } from "../game";
import { onPlayerMove } from "./game-callbacks";
import { onKeepAlive, onQuickplay, quickplay, unsetQuickplay } from "./callbacks";

function isUUID(s: string): s is UUID {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export enum PreGameProtocol {
	Quickplay = 0,
	KeepAlive = 1,
	Error = 2,
	MatchFound = 3,
	MatchmakeError = 4
}

const pregameCallbacks = [
	onQuickplay,
	onKeepAlive
]

export enum Protocol {
	PlayerMoved = 0,
	PlayerAbandoned = 1,
	PlayerDisconnected = 2,
	Ready = 3,
	ChatMessage = 4,
	SpectatorJoin = 5,
	SpectatorLeave = 6,
	StatusChanged = 7,
	PlayerMoveRejected = 8,
	Error = 9
}

const gameCallbacks = [
	onPlayerMove,
];

export function onMessageReceive(data: RawData, conn: GameConnection) {
	const reader = new ByteReader(data);
	const typeId = reader.readUint8();

	if (conn.player && conn.player.game && typeId < Protocol.Error)
		gameCallbacks[typeId](reader, conn.player.game, conn.player);
	else if (typeId < PreGameProtocol.Error)
		pregameCallbacks[typeId](reader, conn);
}

export function onPlayerAbandon(conn: GameConnection, game: GameSession) {
	for (let i = game.spectators.length - 1; i >= 0; i--) {
		if (game.spectators[i].id == conn.id) {
			const spec = game.spectators[i];
			game.spectators.splice(i, 1);

			broadcastToGame(game, buildSpectatorLeave(spec.id));
			return;
		}
	}

	try {
		abandonGame(game.state, conn.id);
	} catch (e) {
		console.log("Failed to abandon game: " + e);
	}
}

export function onPlayerDisconnect(conn: GameConnection, game: GameSession) {
	// Remove spectator
	for (let i = game.spectators.length - 1; i >= 0; --i) {
		if (game.spectators[i].id === conn.id) {
			for (let j = game.spectators[i].conn.length - 1; j >= 0; --j)
			game.spectators[i].conn.splice(j, 1);

			if (game.spectators[i].conn.length === 0) {
				const spec = game.spectators[i];
				game.spectators.splice(i, 1);
				broadcastToGame(game, buildSpectatorLeave(spec.id));
			}
		}
	}

	try {
		abandonGame(game.state, conn.id);
	} catch (e) {
		console.log("Failed to abandon game: " + e);
	}

}
