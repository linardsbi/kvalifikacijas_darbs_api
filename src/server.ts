import errorHandler from "errorhandler";

import app from "./app";
import jwt from "jsonwebtoken";
import { stringify } from "querystring";
import { Response } from "superagent";
import { authenticate as MQTTAuthenticate, handleClientPublish, addController } from "./controllers/MQTTController";
import { startWS } from "./websockets";
import mosca from "mosca";
import * as net from "net";

const moscaServer = new mosca.Server({port: 1884});

/**
 * Error Handler. Provides full stack - remove for production
 */
app.use(errorHandler());

/**
 * start mqtt server
 * when a device connects, if authenticated and not already assigned,
 * gets assigned to user.
 * as a response the device gets parameters on how it should operate.
 * i.e. pins to get info from, type of info, id of device(s).
 *
 * mqtt has a presence channel i.e. controller/machine_id/presence for controllers or client/client_id/presence for clients
 * to declare presence, on connection the client passes a payload and will
 * Need to implement retained messages (LWT), so when client subscribes to presence topic, it gets the payload sent by the
 * other client
 */
start();
export function start(): void {

    moscaServer.on("clientConnected", function(client) {
        console.log("client connected", client.id);
    });

    // fired when a message is received
    moscaServer.on("published", function(packet, client) {
        if (client) {
            handleClientPublish(packet);
        }

        // console.log("Published", packet);
    });

    moscaServer.on("ready", setup);

    // fired when the mqtt server is ready
    function setup() {
        console.log("Mosca server is up and running");
        startWS();
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
