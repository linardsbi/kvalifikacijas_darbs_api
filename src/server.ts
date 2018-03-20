import errorHandler from "errorhandler";

import app from "./app";
import WebSocket from "ws";
import {stringify} from "querystring";

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

/**
 * Start WebSocket server.
 */
const wss = new WebSocket.Server({ port: process.env.WS_PORT });

wss.on("connection", function connection(ws: any) {
    ws.on("message", function incoming(message: any) {
        console.log("received %s", message);
    });
});

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
