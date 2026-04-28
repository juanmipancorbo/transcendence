import { reset as resetUser } from "./user/reset";
import { reset as resetGame } from "./game/reset";

async function reset() {
  if (process.env.NODE_ENV !== "development") {
    console.error("Don't even try")
    process.exit(1);
  }
  await resetUser();
  await resetGame();
}

reset().catch((err) => {
  console.error("Database Reset failed: ", err);
  process.exitCode = 1;
});
