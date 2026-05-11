import { Pool } from "pg";

const sql = String.raw;

export async function ft_delete(){
  const pool = new Pool();

  await pool.query(sql`
    DROP TABLE IF EXISTS user_profiles;
  `);

  await pool.query(sql`
    DROP TABLE IF EXISTS users;
  `);

  await pool.end();

  console.log("Users deleted")
}
