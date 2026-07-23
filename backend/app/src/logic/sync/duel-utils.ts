function put(map: Map<string, Set<string>>, key: string, value: string): boolean {
	const set = map.get(key);

	if (set) {
		if (set.has(value)) return false;
		set.add(value);
	} else map.set(key, new Set([value]));

	return true;
}

function remove(map: Map<string, Set<string>>, key: string, value: string): boolean {
	const set = map.get(key);

	if (set) {
		if (!set.delete(value)) return false;

		if (set.size === 0)
			map.delete(key);
		return true;
	}

	return false;
}

export interface DuelSettings {
	allowSpectators: boolean,
	timeLimit: number,
}

export class DuelRequestsManager {
	private duelSends: Map<string, Set<string>> = new Map();
	private duelSettings: Map<string, DuelSettings> = new Map();
	private timers: Map<string, NodeJS.Timeout> = new Map();

	constructor() {}

	private removeRequest(sender: string, receiver: string) {
		remove(this.duelSends, sender, receiver);
		const entry = `${sender},${receiver}`;

		clearTimeout(this.timers.get(entry));
		this.duelSettings.delete(entry);
		this.timers.delete(entry);
	}

	sendRequest(sender: string, receiver: string, settings: DuelSettings): boolean {
		const sent = put(this.duelSends, sender, receiver);
		if (!sent) return false;

		const entry = `${sender},${receiver}`;
		this.duelSettings.set(entry, settings);
		this.timers.set(entry, setTimeout(() => this.removeRequest(sender, receiver), 16000)); // Request lasts for 16 seconds

		return true;
	}

	hasSentRequest(id: string): boolean { return this.duelSends.has(id); }

	acceptRequest(receiver: string, sender: string): DuelSettings | null {
		const entry = `${sender},${receiver}`;
		const settings = this.duelSettings.get(entry);
		if (settings) {
			this.removeRequest(sender, receiver);
			return settings;
		}

		return null;
	}
}
