import { del as deleteDatabase } from "./database/delete";
import { init as initDatabase} from "./database/init";
async function reset() {
  if (process.env.NODE_ENV !== "development") {
    console.error("Don't even try")
    process.exit(1);
  }

  await deleteDatabase();
  await initDatabase();
}

reset().catch((err) => {
  console.error("Database Reset failed: ", err);
  process.exitCode = 1;
});
