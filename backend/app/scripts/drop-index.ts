import { del as deleteDatabase } from "./database/delete";

async function reset() {
  if (process.env.NODE_ENV !== "development") {
    console.error("Don't even try")
    process.exit(1);
  }

  await deleteDatabase();
}

reset().catch((err) => {
  console.error("Database Reset failed: ", err);
  process.exitCode = 1;
});
