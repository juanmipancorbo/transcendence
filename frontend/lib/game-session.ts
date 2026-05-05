import { GameState, PreGameProtocol } from "@/types";
import { GameSocket } from "./ws/socket";
import { WS_URL } from "./config";

// Public interface for managing remote game state
class GameSession {
	private _socket: GameSocket;
	private _game: GameState;

	constructor(socket: GameSocket) {
		this._socket = socket;
	}

	setup() {
		
	}

	get socket() { return this._socket; }
	get game() { return this._game; }
}

export function joinMatch(): GameSession {}
export function matchmake(callback: (foundGame: GameSession | Error) => void) {
	const socket = new GameSocket(WS_URL + "/matches/quickplay", (e) => {
		if (e) {
			callback(e);
			return;
		}
		socket.on(PreGameProtocol.MatchFound, r => {
			const board = r.readBoard();
			const timeLimit = r.readUint32();
			const color = r.readUint8();
			const opponentId = r.readPrefixedUTF();
			const allowSpectators = r.readBool();
			// TODO
		})
	});
}
