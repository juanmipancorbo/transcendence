import { Pool } from "pg";

const sql = String.raw;

export async function del() {
  const pool = new Pool();

  // Tables (CASCADE also removes their triggers, indexes and constraints)
  const dropSession = sql`DROP TABLE IF EXISTS auth_sessions CASCADE;`;
  const dropGame = sql`DROP TABLE IF EXISTS games CASCADE;`;
  const dropUser = sql`DROP TABLE IF EXISTS users CASCADE;`;

  // Trigger (also dropped with the users table, but explicit for safety)
  const dropTrigger = sql`DROP TRIGGER IF EXISTS users_update_level ON users CASCADE;`;

  // Functions
  const dropTrgFn = sql`DROP FUNCTION IF EXISTS trg_update_level_from_xp() CASCADE;`;
  const dropLevelFromXp = sql`DROP FUNCTION IF EXISTS level_from_xp(BIGINT) CASCADE;`;
  const dropXpForLevel = sql`DROP FUNCTION IF EXISTS xp_for_level(INTEGER) CASCADE;`;

  // Custom types
  const dropMoveType = sql`DROP TYPE IF EXISTS move CASCADE;`;

  await pool.query(dropTrigger);
  console.log(`dropped trigger users_update_level`);
  await pool.query(dropSession);
  console.log(`dropped table auth_sessions`);
  await pool.query(dropGame);
  console.log(`dropped table games`);
  await pool.query(dropUser);
  console.log(`dropped table users`);
  await pool.query(dropTrgFn);
  console.log(`dropped function trg_update_level_from_xp`);
  await pool.query(dropLevelFromXp);
  console.log(`dropped function level_from_xp`);
  await pool.query(dropXpForLevel);
  console.log(`dropped function xp_for_level`);
  await pool.query(dropMoveType);
  console.log(`dropped type move`);

  await pool.end();
}
