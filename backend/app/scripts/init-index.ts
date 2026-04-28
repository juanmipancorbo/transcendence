import { init as initUser } from "./user/init";
import { init as initGame } from "./game/init";

async function init() {
  if (process.env.NODE_ENV !== "development") {
    console.error("Don't even try")
    process.exit(1);
  }
  await initUser();
  await initGame();
}

init().catch((err) => {
  console.error("Database Init failed: ", err);
  process.exitCode = 1;
});