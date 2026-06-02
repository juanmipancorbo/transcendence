import express from "express";
import { router as routerUser } from "./src/database/user/router";
import { router as routerAuth } from "./src/database/auth/router";
import { router as routerGame } from "./src/database/game/router";
import routerWs from "./websockets";

const app: express.Application = express();

const port = Number(process.env.PORT ?? "3000");

app.use(express.json());

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
	if (req.method === "OPTIONS") {
		return res.sendStatus(204);
	}
	next();
});

app.use("/matches", routerWs);
app.get('/', (_req, _res) => {
	_res.send("TypeScript With Express");
});

// Server start
app.listen(port, _ => {
	console.log("Listening on http://" + ":" + port);
});

app.use("/users", routerUser)
app.use("/auth", routerAuth)
app.use("/game", routerGame)
