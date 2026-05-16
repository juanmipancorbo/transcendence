import { Pool } from "pg";

const sql = String.raw;

export async function ft_delete(){
  const pool = new Pool();

  await pool.query(sql`
    DROP TABLE IF EXISTS user_stats;
  `);

  await pool.query(sql`
    DROP TABLE IF EXISTS games;
  `);

  await pool.query(sql`
    DROP TYPE IF EXISTS game_status;
  `);

  await pool.end();

  console.log("Games deleted")
}
