import express from "express";
import { router as routerUser } from "./src/database/user/route";

const app: express.Application = express();

const port = Number(process.env.PORT ?? "3000");

app.get('/', (_req, _res) => {
	_res.send("TypeScript With Express");
});

// Server start
app.listen(port, _ => {
	console.log("Listening on http://" + ":" + port);
});

app.use("/users", routerUser)
