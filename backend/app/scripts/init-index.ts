import { init as initUser } from "./user/init";

initUser().catch((err) => {
  console.error("Database Init failed: ", err);
  process.exitCode = 1;
});
