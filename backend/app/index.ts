import express from "express";
import routerWs from "./websockets";

const app: express.Application = express();

const host = process.env.HOST ?? "localhost";
const port = Number(process.env.PORT ?? "3000");

app.use("/matches", routerWs);
app.get('/', (_req, _res) => {
	_res.send("TypeScript With Express");
});

// Server start
app.listen(port, host, _ => {
	console.log("Listening on http://" + host + ":" + port);
});
