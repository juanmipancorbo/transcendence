import { seed as seedUser } from "./user/seed";

async function seed() {
  if (process.env.NODE_ENV !== "development") {
    console.error("Don't even try")
    process.exit(1);
  }
  await seedUser();
}

seed().catch((err) => {
  console.error("Database Seed failed: ", err);
  process.exitCode = 1;
});
