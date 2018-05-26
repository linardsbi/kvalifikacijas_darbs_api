"use strict";
import mqtt from "mqtt";
import WebSocket from "ws";
import {WSClientInstance} from "./controllers/BridgeController";
import {EventHandler} from "./util/helpers/eventHandling";


/**
 * WebSocket - MQTT bridge, so the browser can use websockets to subscribe to MQTT topics
 * client connects to ws server, passes topics it subscribes to
 * bridgeclient subscribes to topics, on receiving data, passes it to WS client
 */

let WSConnection: any;
// retain test
// const client1 = mqtt.connect("mqtt://localhost:1884", {clientId: "esp_68:C6:3A:80:97:A5"});
// client1.on('connect', function () {
//     client1.subscribe("controllers/esp_68:C6:3A:80:97:A5/devices/new");
//     client1.publish("controllers/aaa/presence", "1", {retain: true});
// });
// client1.on('message', function (topic, message) {
//     console.log(topic, message);
// });
/**
 * Start WebSocket server.
 */
export function startWS() {
    const wss = new WebSocket.Server({port: parseInt(process.env.WS_PORT)});

    wss.on("listening", () => {
        EventHandler.log("Info", `WebSocket server started on port ${process.env.WS_PORT}`);
    });

    wss.on("connection", function connection(ws: any, req) {
        WSConnection = new WSClientInstance(ws);
        console.log(req.connection.remoteAddress);
        // Once server started and client connected, connect to mqtt server
        // WSConnection._mqttClient = client;
    });
}
