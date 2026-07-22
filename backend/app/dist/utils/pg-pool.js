"use strict";
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = require("pg");
function sanitizeEnv(val) {
    if (!val)
        return undefined;
    const low = val.toLowerCase();
    if (low.includes('name') || low.includes('host') || low.includes('user') || low.includes('password') || low.includes('port') || low.includes('placeholder'))
        return undefined;
    return val;
}
const host = (_b = (_a = sanitizeEnv(process.env.PGHOST)) !== null && _a !== void 0 ? _a : sanitizeEnv(process.env.POSTGRES_HOST)) !== null && _b !== void 0 ? _b : "localhost";
const port = Number((_d = (_c = sanitizeEnv(process.env.PGPORT)) !== null && _c !== void 0 ? _c : sanitizeEnv(process.env.POSTGRES_PORT)) !== null && _d !== void 0 ? _d : 5432) || 5432;
const user = (_e = sanitizeEnv(process.env.PGUSER)) !== null && _e !== void 0 ? _e : sanitizeEnv(process.env.POSTGRES_USER);
const password = (_f = sanitizeEnv(process.env.PGPASSWORD)) !== null && _f !== void 0 ? _f : sanitizeEnv(process.env.POSTGRES_PASSWORD);
const database = (_g = sanitizeEnv(process.env.PGDATABASE)) !== null && _g !== void 0 ? _g : sanitizeEnv(process.env.POSTGRES_DB);
const pool = new pg_1.Pool({
    host,
    port,
    user,
    password,
    database,
});
exports.pool = pool;
pool.on('error', (err) => {
    console.error('Unexpected error on idle pg client', err);
});
