import errorHandler from "errorhandler";

import app from "./app";
import WebSocket from "ws";
import jwt from "jsonwebtoken";
import { stringify } from "querystring";
import { Response } from "superagent";

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

function generateSignedToken(): String {
    return jwt.sign({ foo: "bar" }, process.env.APPLICATION_KEY);
}

function verifyToken(token: string): boolean {
    try {
        const decoded = jwt.verify(token, process.env.APPLICATION_KEY);
    } catch (e) {
        console.error("token mismatch", e);
        return false;
    }
    console.log("successful connection");
    return true;
}

function verifyClientInfo(info: Response): boolean {
    return verifyToken(info.req.headers.token);
}

/**
 * Start WebSocket server.
 */
const wss = new WebSocket.Server({ port: process.env.WS_PORT, verifyClient: verifyClientInfo });

let msgCount: number;

function noop(): void {}

function heartbeat(): void {
    this.isAlive = true;
}

wss.on("connection", function connection(ws: any) {
    ws.on("message", function incoming(message: any) {

        console.log("received %s", JSON.parse(message).aaa);

        msgCount++;
        if (msgCount > 3) ws.terminate();
    });

    ws.on("error", function incoming(err: any) {
        console.error("error occurred: %s", err.toString());
    });

    ws.isAlive = true;
    ws.on("pong", heartbeat);
});

const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();

        ws.isAlive = false;
        ws.ping(noop);
    });
}, 15000);

export { wss as WebSocketServer };

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
  console.log(
    "  App is running at http://localhost:%d in %s mode",
    app.get("port"),
    app.get("env")
  );
  console.log("  Press CTRL-C to stop\n");
});

export default server;
