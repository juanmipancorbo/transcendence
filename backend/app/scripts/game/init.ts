import { Pool } from "pg";
import fs from "fs";

const sql = fs.readFileSync("/app/initdb.d/initgame.sql").toString();

export async function init(){
  const pool = new Pool();

  await pool.query(sql);

  await pool.end();

  console.log("Games inited")
}