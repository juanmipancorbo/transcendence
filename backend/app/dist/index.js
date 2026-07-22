"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const path_1 = __importDefault(require("path"));
const router_1 = require("@databaseAccess/user/router");
const router_2 = require("@databaseAccess/auth/router");
const router_3 = require("@databaseAccess/friend/router");
const router_4 = require("@databaseAccess/leaderboard/router");
const router_5 = require("@databaseAccess/chat/router");
const router_6 = require("@databaseAccess/google/router");
const router_7 = require("@databaseAccess/game/router");
const websockets_1 = require("./websockets");
const error_middleware_1 = require("./middleware/error-middleware");
const session_1 = require("@gameLogic/sync/session");
(0, session_1.restoreUnfinishedSessions)(); // Recover unfinished games in case of crash or sudden shutdown.
const { app } = (0, express_ws_1.default)((0, express_1.default)());
const SUCCESS_COLOR = "\x1b[32m";
const FAILURE_COLOR = "\x1b[31m";
const RESET_COLOR = "\x1b[0m";
const port = Number((_a = process.env.PORT) !== null && _a !== void 0 ? _a : "3000");
app.use(express_1.default.json());
app.use("/uploads", express_1.default.static(path_1.default.resolve(process.cwd(), "uploads")));
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
    else
        console.warn(`${FAILURE_COLOR}[${res.statusCode}] ${req.method} ${req.path} latency=${Math.round(after - before)}ms${RESET_COLOR}`);
});
// WebSockets endpoint(s).
// do not make a router as express-ws with routers is a pain
app.ws("/ws/create", websockets_1.create);
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
app.use("/users", router_1.router);
app.use("/auth", router_2.router);
app.use("/friends", router_3.router);
app.use("/leaderboard", router_4.router);
app.use("/chats", router_5.router);
app.use("/google", router_6.router);
app.use("/games", router_7.router);
// Error Handler (has to be last one)
app.use(error_middleware_1.errorHandler);
