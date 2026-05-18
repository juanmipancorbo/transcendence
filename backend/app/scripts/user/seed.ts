import { Pool } from "pg";
import { faker } from "@faker-js/faker";
import argon2 from "argon2"

const sql = String.raw;


export async function seed(){
  const pool = new Pool();

  const count = 10;
  const password = argon2.hash("42Barcelona");

  try {
    for (let i = 0; i < count; i++) {
      const values = [
        faker.internet.username(),
        faker.internet.email(),
        password,
        faker.image.avatar(),
      ];
      await pool.query(sql`
      INSERT INTO users (username, email, password_hash, avatar_url)
        VALUES ($1, $2, $3, $4)
      `, values);
    }
  } catch (err) {
    console.error('Seeding failed:', err);
  }
  
  console.log("Users seeded")
  await pool.end();
}