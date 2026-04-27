import express from "express";

const app: express.Application = express();

const port = Number(process.env.PORT ?? "3000");

app.get('/', (_req, _res) => {
	_res.send("TypeScript With Express");
});

// Server start
app.listen(port, _ => {
	console.log("Listening on http://" + ":" + port);
});
