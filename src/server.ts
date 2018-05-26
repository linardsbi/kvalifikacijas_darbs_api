import errorHandler from "errorhandler";

import app from "./app";
import {handleClientPublish, handleClientSubscribe} from "./controllers/MQTTController";
import {startWS} from "./websockets";
import mosca from "mosca";
import {EventHandler} from "./util/helpers/eventHandling";

let moscaServer: any;

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

if (process.env.BUILT_IN_BROKER === "YES") {
    const ascoltatore = {
        type: "mongo",
        url: `${process.env.MONGODB_URI_LOCAL}/mqtt`,
        pubsubCollection: "ascoltatori",
        mongo: {}
    };

    const moscaSettings = {
        port: parseInt(process.env.MQTT_PORT),
        persistence: {
            factory: mosca.persistence.Memory
        },
        backend: ascoltatore
    };

    moscaServer = new mosca.Server(moscaSettings);

    start();
}

export function start(): void {

    moscaServer.on("clientConnected", function (client: any) {
        console.log("client connected", client.id);
    });
    moscaServer.on("clientDisconnected", function (client: any) {
        console.log("client disconnected", client.id);
    });
    // fired when a message is received
    moscaServer.on("published", function (packet: any, client: any) {
        if (client) {
            handleClientPublish(packet, moscaServer);
        }
    });

    moscaServer.on("subscribed", (topic: any, client: any) => {
        if (client) {
            console.log(client.id, "subscribed to", topic);
            handleClientSubscribe(topic, moscaServer);
        }
    });

    moscaServer.on("ready", setup);

    // fired when the mqtt server is ready
    function setup() {
        const message = `Mosca server is up and running on port ${process.env.MQTT_PORT}`;

        console.log(message);
        EventHandler.log("Info", message);

        startWS();
    }

    moscaServer.authenticate = (client: any, username: string, password: string, callback: Function) => {
        // if (username && password) {
        //     client.username = username;
        //     MQTTAuthenticate(client.id, username, password.toString()).then((result) => {
        //         // addController(client.id, username);
        //         callback(undefined, true);
        //     }).catch((err) => {
        //         err.returnCode = 1;
        //         callback(err, undefined);
        //     });
        // } else
        callback(undefined, true);
    };

    moscaServer.authorizePublish = function (client: any, topic: string, payload: any, callback: Function) {

        callback(undefined, true);
    };

    moscaServer.authorizeSubscribe = function (client: any, topic: string, callback: Function) {
        // console.log(topic, client.id);
        callback(undefined, true);
    };
}

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
    const message: string = `App is running at http://localhost:${app.get("port")} in ${app.get("env")} mode`;
    console.log(message);

    EventHandler.log("Info", message);
});

export default server;
