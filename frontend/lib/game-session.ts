import { GameSocket } from "./ws/socket";

// Public interface for managing remote game state
class GameSession {
	private _socket: GameSocket;
	constructor(socket: GameSocket) {
		this._socket = socket;
		this.setup();
	}

	private setup() {
		
	}

	get socket() { return this._socket; }
}

export function joinMatch(): GameSession {}
export function matchmake(callback: (foundGame: GameSession | Error) => void) {}
