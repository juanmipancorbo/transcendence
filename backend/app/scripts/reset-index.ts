import { ft_delete as deleteUser } from "./user/delete";
import { ft_delete as deleteGame } from "./game/delete";
import { init as initUser } from "./user/init";
import { init as initGame } from "./game/init";

async function reset() {
  if (process.env.NODE_ENV !== "development") {
    console.error("Don't even try")
    process.exit(1);
  }
  await deleteGame();
  await deleteUser();
  await initUser();
  await initGame();
}

reset().catch((err) => {
  console.error("Database Reset failed: ", err);
  process.exitCode = 1;
});
