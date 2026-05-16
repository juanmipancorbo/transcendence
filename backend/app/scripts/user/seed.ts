import { Pool } from "pg";
import { faker } from "@faker-js/faker";
import argon2 from "argon2"

const sql = String.raw;


export async function seed(){
  const pool = new Pool();

  const count = 10;
  const password = await argon2.hash("42_Barcelona");

  try {
    for (let i = 0; i < count; i++) {
      const values = [
        faker.internet.username(),
        faker.internet.email(),
        password,
      ];
      await pool.query(sql`
      INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
      `, values);
    }
  } catch (err) {
    console.error('Seeding failed:', err);
  }
  
  console.log("Users seeded")
  await pool.end();
}