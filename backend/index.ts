import express from "express";
import dotenv from "dotenv";

const res = dotenv.config();
if (res.error)
	throw res.error;

const app: express.Application = express();

const host = process.env.HOST ?? "localhost";
const port = Number(process.env.PORT ?? "3000");

app.get('/', (_req, _res) => {
	_res.send("TypeScript With Express");
});

// Server start
app.listen(port, host, _ => {
	console.log("Listening on http://" + host + ":" + port);
});
