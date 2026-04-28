import { Pool } from "pg";
import { init } from "./init"

const sql = String.raw;

export async function reset(){
  const pool = new Pool();

  await pool.query(sql`
    DROP TABLE IF EXISTS games;
  `);

  await pool.query(sql`
    DROP TYPE IF EXISTS game_status;
  `);

  await pool.end();

  await init();
  console.log("Games reseted")
}
