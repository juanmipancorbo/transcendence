import * as Repo from "./repository";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function readTop(rawLimit: unknown) {
	const parsed = Number(rawLimit ?? DEFAULT_LIMIT);
	const limit = Number.isFinite(parsed)
		? Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT)
		: DEFAULT_LIMIT;

	return Repo.selectTop(limit);
}
