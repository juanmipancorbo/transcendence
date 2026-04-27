import { UUID } from "crypto";
import { PreGameProtocol, Protocol } from "./protocol";
import { ByteWriter } from "./stream-utils/writer";

// PreGame

export function buildMatchmakeError(message: string): BufferSource {
	const writer = new ByteWriter();
	writer.writeUint8(PreGameProtocol.MatchmakeError);
	writer.writePrefixedUTF(message);

	return writer.freeze();
}

export function buildPreGameError(message: string): BufferSource {
	const writer = new ByteWriter();
	writer.writeUint8(PreGameProtocol.Error);
	writer.writePrefixedUTF(message);

	return writer.freeze();
}

export function buildMatchFound(gameId: UUID, color: number, opponent: UUID): BufferSource {
	const writer = new ByteWriter();
	writer.writeUint8(PreGameProtocol.MatchFound);
	writer.writePrefixedUTF(gameId);
	writer.writeUint8(color);
	writer.writePrefixedUTF(opponent);

	return writer.freeze();
}

// In-Game

export function buildGameError(message: string): BufferSource {
	const writer = new ByteWriter();
	writer.writeUint8(Protocol.Error);
	writer.writePrefixedUTF(message);

	return writer.freeze();
}
