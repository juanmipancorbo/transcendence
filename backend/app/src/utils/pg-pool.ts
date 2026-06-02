import { Pool } from "pg"

function sanitizeEnv(val?: string) {
	if (!val) return undefined;
	const low = val.toLowerCase();
	if (low.includes('name') || low.includes('host') || low.includes('user') || low.includes('password') || low.includes('port') || low.includes('placeholder')) return undefined;
	return val;
}

const host = sanitizeEnv(process.env.PGHOST) ?? sanitizeEnv(process.env.POSTGRES_HOST) ?? "localhost";
const port = Number(sanitizeEnv(process.env.PGPORT) ?? sanitizeEnv(process.env.POSTGRES_PORT) ?? 5432) || 5432;
const user = sanitizeEnv(process.env.PGUSER) ?? sanitizeEnv(process.env.POSTGRES_USER);
const password = sanitizeEnv(process.env.PGPASSWORD) ?? sanitizeEnv(process.env.POSTGRES_PASSWORD);
const database = sanitizeEnv(process.env.PGDATABASE) ?? sanitizeEnv(process.env.POSTGRES_DB);

const pool = new Pool({
	host,
	port,
	user,
	password,
	database,
});

pool.on('error', (err) => {
	console.error('Unexpected error on idle pg client', err);
});

export { pool };