import { Pool } from "pg";
import { init } from "./init"

const sql = String.raw;

export async function reset(){
  const pool = new Pool();

  await pool.query(sql`
    DROP TABLE IF EXISTS users;
  `);

  await pool.end();

  await init();
  console.log("Users reseted")
}
