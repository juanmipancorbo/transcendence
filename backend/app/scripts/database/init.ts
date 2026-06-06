import { Pool } from "pg";
import fs from "fs";

export async function init()
{
  const pool = new Pool();

  const userSql = fs.readFileSync("/app/initdb.d/01_inituser.sql").toString();
  const gameSql = fs.readFileSync("/app/initdb.d/02_initgame.sql").toString();
  const profileSql = fs.readFileSync("/app/initdb.d/03_inituser_profile.sql").toString();
  const statsSql = fs.readFileSync("/app/initdb.d/04_inituser_stat.sql").toString();
  const sessionSql = fs.readFileSync("/app/initdb.d/05_initauth_session.sql").toString();

  await pool.query(userSql);
  console.log(`create user table`);
  await pool.query(gameSql);
  console.log(`create game table`);
  await pool.query(profileSql);
  console.log(`create profile table`);
  await pool.query(statsSql);
  console.log(`create stat table`);
  await pool.query(sessionSql);

  await pool.end();
}