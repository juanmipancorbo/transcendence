import { init as initUser } from "./user/init";
import { init as initGame } from "./game/init";
import { init as initAuth } from "./auth/init";

async function init() {
 /* if (process.env.NODE_ENV !== "development") {
    console.error("Don't even try")
    process.exit(1);
  }*/
  await initUser();
  await initGame();
  await initAuth();
}

init().catch((err) => {
  console.error("Database Init failed: ", err);
  process.exitCode = 1;
});