import express, { Router } from "express";
import expressWs from "express-ws";
import { router as routerUser } from "./src/database/user/router";
import { router as routerAuth } from "./src/database/auth/router";
import { router as routerGame } from "./src/database/game/router";
import routerWs from "./websockets";

const ws = expressWs(express());
const app = ws.app;

const SUCCESS_COLOR = "\\e[32m";
const FAILURE_COLOR = "\\e[31m";
const RESET_COLOR = "\\e[0m";

const port = Number(process.env.PORT ?? "3000");

app.use(express.json());

app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
	if (req.method === "OPTIONS") {
		return res.sendStatus(204);
	}
	const before = performance.now();
	next();
	const after = performance.now();
	if (res.statusCode < 400)
		console.info(`${SUCCESS_COLOR}[${res.statusCode}] ${req.method} ${req.path} latency=${Math.round(after - before)}ms${RESET_COLOR}`);
	else console.warn(`${FAILURE_COLOR}[${res.statusCode}] ${req.method} ${req.path} latency=${Math.round(after - before)}ms${RESET_COLOR}`);
});

const wsRouter = Router();
ws.applyTo(wsRouter);
routerWs(wsRouter);

app.use("/matches", wsRouter);
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
