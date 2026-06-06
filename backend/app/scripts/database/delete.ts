import { Pool } from "pg";

const sql = String.raw;

export async function del() {
  const pool = new Pool();

  const delUser = sql`DROP TABLE IF EXISTS users;`;
  const delGame = sql`DROP TABLE IF EXISTS games;`;
  const delStatus = sql`DROP TYPE IF EXISTS game_status;`;
  const delProfile = sql`DROP TABLE IF EXISTS user_profiles;`;
  const delStat = sql`DROP TABLE IF EXISTS user_stats;`;
  const delSession = sql`DROP TABLE IF EXISTS auth_sessions;`;
  const delIdIdx = sql`DROP INDEX IF EXISTS idx_auth_sessions_user_id;`;
  const delExpIdx = sql`DROP TABLE IF EXISTS idx_auth_sessions_expires_id;`;

  await pool.query(delIdIdx);
  console.log(`deleted user_id_idx`);
  await pool.query(delExpIdx);
  console.log(`deleted expires_at_idx`);
  await pool.query(delSession);
  console.log(`deleted session`);
  await pool.query(delStat);
  console.log(`deleted stat`);
  await pool.query(delProfile);
  console.log(`deleted profile`);
  await pool.query(delStatus);
  console.log(`deleted status`);
  await pool.query(delGame);
  console.log(`deleted game`);
  await pool.query(delUser);
  console.log(`deleted user`);

  await pool.end();
}