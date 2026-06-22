import express from "express";
import expressWs from "express-ws";
import { router as routerUser } from "@databaseAccess/user/router";
import { router as routerAuth } from "@databaseAccess/auth/router";
import { router as routerGame } from "@databaseAccess/game/router";
import { join, joinMiddl, quickplay } from "./src/websockets";
import { errorHandler } from "./src/middleware/error-middleware";

const { app, getWss, applyTo } = expressWs(express());

const SUCCESS_COLOR = "\x1b[32m";
const FAILURE_COLOR = "\x1b[31m";
const RESET_COLOR = "\x1b[0m";

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

// WebSockets endpoints.
// do not make a router as express-ws with routers is broken
app.use("/play/join", joinMiddl);
app.ws("/play/quickplay", quickplay);
app.ws("/play/join", join);


app.get('/', (_req, _res) => {
	_res.send("TypeScript With Express");
});

// Server start
app.listen(port, _ => {
	console.log("Listening on http://localhost" + ":" + port);
});

app.use("/users", routerUser)
app.use("/auth", routerAuth)
app.use("/game", routerGame)

// Error Handler (has to be last one)
app.use(errorHandler);