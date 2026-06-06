import { init as initDatabase } from "./database/init";

async function init() {
  if (process.env.NODE_ENV !== "development") {
    console.error("Don't even try")
    process.exit(1);
  }

  await initDatabase();
}

init().catch((err) => {
  console.error("Database Init failed: ", err);
  process.exitCode = 1;
});