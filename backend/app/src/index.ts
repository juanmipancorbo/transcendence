import express from "express";
import expressWs from "express-ws";
import path from "path";
import { router as routerUser } from "@databaseAccess/user/router";
import { router as routerAuth } from "@databaseAccess/auth/router";
import { router as routerFriend } from "@databaseAccess/friend/router";
import { router as routerLeaderboard } from "@databaseAccess/leaderboard/router";
import { router as routerChat } from "@databaseAccess/chat/router";
import { router as googleAuth } from "@databaseAccess/google/router";
import { router as routerGames } from "@databaseAccess/game/router";
import { create } from "./websockets";
import { errorHandler } from "./middleware/error-middleware";
import { restoreUnfinishedSessions } from "@gameLogic/sync/session";

restoreUnfinishedSessions(); // Recover unfinished games in case of crash or sudden shutdown.

const { app } = expressWs(express());

const SUCCESS_COLOR = "\x1b[32m";
const FAILURE_COLOR = "\x1b[31m";
const RESET_COLOR = "\x1b[0m";

const port = Number(process.env.PORT ?? "3000");

app.use(express.json());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

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

// WebSockets endpoint(s).
// do not make a router as express-ws with routers is a pain
app.ws("/ws/create", create);

// Healthcheck to see if server is up
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: "UP",
        timestamp: new Date().toISOString(),
    });
});

// Server start
app.listen(port, _ => {
	console.log("Listening on http://localhost" + ":" + port);
});

app.use("/users", routerUser);
app.use("/auth", routerAuth);
app.use("/friends", routerFriend);
app.use("/leaderboard", routerLeaderboard);
app.use("/chats", routerChat);
app.use("/google", googleAuth);
app.use("/games", routerGames);

// Error Handler (has to be last one)
app.use(errorHandler);
