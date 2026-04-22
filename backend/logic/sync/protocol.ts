import { RawData } from "ws";
import { ByteReader } from "./stream-utils/reader";

export enum Protocol {
	StatusChanged,
	PlayerMoveAccepted,
	PlayerMoveRejected,
	PlayerAbandoned,
	PlayerDisconnected
}

const callbacks = [
	
];

function onMessageReceive(data: RawData) {
	const reader = new ByteReader(data);

	
}
