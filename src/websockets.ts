"use strict";
import mqtt from "mqtt";
import WebSocket from "ws";
import {WSClientInstance} from "./controllers/BridgeController";


/**
 * WebSocket - MQTT bridge, so the browser can use websockets to subscribe to MQTT topics
 * client connects to ws server, passes topics it subscribes to
 * bridgeclient subscribes to topics, on receiving data, passes it to WS client
 */

let WSConnection: any;

// retain test
// const client1 = mqtt.connect("mqtt://localhost:1884", {clientId: "controller"});
// client1.on('connect', function () {
//     client1.subscribe("controllers/aaa/presence");
//     client1.publish("controllers/aaa/presence", "1", {retain: true});
// });

/**
 * Start WebSocket server.
 */
export function startWS() {
    const wss = new WebSocket.Server({ port: parseInt(process.env.WS_PORT) });

    wss.on("connection", function connection(ws: any) {
        WSConnection = new WSClientInstance(ws);

        // Once server started and client, connect to mqtt server

        // WSConnection._mqttClient = client;
    });
}
