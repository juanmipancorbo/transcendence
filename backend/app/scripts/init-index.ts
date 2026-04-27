import { bootstrap as bootstrapUser } from "./user/init";

bootstrapUser().catch((err) => {
  console.error("Database Init failed: ", err);
  process.exitCode = 1;
});
