import errorHandler from "errorhandler";

import app from "./app";
import WebSocket from "ws";
import jwt from "jsonwebtoken";
import { stringify } from "querystring";
import { Response } from "superagent";
import { authenticate as MQTTAuthenticate, handleClientPublish, addController } from "./controllers/MQTTController";
import mosca from "mosca";
import mqttws from "mqtt-ws";
import * as net from "net";
import { handle, WSInstance, emitPresence } from "./controllers/WSController";

const moscaServer = new mosca.Server({port: 1884});

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

function generateSignedToken(): String {
    return jwt.sign({ foo: "bar" }, process.env.APPLICATION_KEY);
}

// function verifyToken(token: string): boolean {
//     try {
//         const decoded = jwt.verify(token, process.env.APPLICATION_KEY);
//     } catch (e) {
//         console.error("token mismatch", e);
//         return false;
//     }
//     console.log("successful connection");
//     return true;
// }

// function verifyClientInfo(info: Response): boolean {
//     return verifyToken(info.req.headers.token);
// }

/**
 * Start WebSocket server.
 */
// const wss = new WebSocket.Server({ port: process.env.WS_PORT });

// function noop(): void {}

// function heartbeat(): void {
//     this.isAlive = true;
// }

// wss.on("connection", function connection(ws: any) {
//     const WSConnection = new WSInstance(ws);

//     ws.on("message", function incoming(message: any) {
//         WSConnection.handle(message);
//     });

//     ws.on("error", function incoming(err: any) {
//         console.error("error occurred: %s", err.toString());
//     });

//     ws.isAlive = true;
//     ws.on("pong", heartbeat);
// });

// const interval = setInterval(function ping() {
//     wss.clients.forEach(function each(ws) {
//         if (ws.isAlive === false) return ws.terminate();

//         ws.isAlive = false;
//         ws.ping(noop);
//     });
// }, 15000);

// export { wss as WebSocketServer };

/**
 * start mqtt server
 * when a device connects, if authenticated and not already assigned,
 * gets assigned to user.
 * as a response the device gets parameters on how it should operate.
 * i.e. pins to get info from, type of info, id of device(s).
 *
 */
start();
export function start(): void {
    const mqttOptions = {
        host: "localhost",
        port: 1884
    };
    const options = {
        mqtt: mqttOptions,
        websocket: {
            port: 8080
        }
    };
    const mqttBridge = new mqttws(options);
    mqttBridge.connectMqtt(mqttOptions);

    mqttBridge.on("connection", function(ws) {
        console.log("client connected");
    });

    moscaServer.on("clientConnected", function(client) {
        console.log("client connected", client.id);
    });

    // fired when a message is received
    moscaServer.on("published", function(packet, client) {
        if (client) {
            handleClientPublish(packet);
        }

        console.log("Published", packet);
    });

    moscaServer.on("ready", setup);

    // fired when the mqtt server is ready
    function setup() {
        console.log("Mosca server is up and running");
    }

    moscaServer.authenticate = (client, username, password, callback: Function) => {
        // if (username && password) {
        //     client.username = username;
        //     MQTTAuthenticate(client.id, username, password.toString()).then((result) => {
        //         // addController(client.id, username);
        //         callback(null, true);
        //     }).catch((err) => {
        //         err.returnCode = 1;
        //         callback(err, null);
        //     });
        // } else
            callback(null, true);
    };

    moscaServer.authorizePublish = function(client, topic, payload, callback) {

        callback(null, true);
    };

    moscaServer.authorizeSubscribe = function(client, topic, callback) {

        callback(null, true);
    };
}


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
