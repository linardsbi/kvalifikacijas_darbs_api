"use strict";
import mqtt from "mqtt";
import WebSocket from "ws";
import {WSInstance, MQTTClientInstance, WSClientInstance} from "./controllers/BridgeController";


/**
 * WebSocket - MQTT bridge, so the browser can use websockets to subscribe to MQTT topics
 * client connects to ws server, passes topics it subscribes to
 * bridgeclient subscribes to topics, on receiving data, passes it to WS client
 */

let WSConnection: any;
const client = mqtt.connect("mqtt://localhost:1884");

/**
 * Start WebSocket server.
 */

export function startWS() {
    const wss = new WebSocket.Server({ port: process.env.WS_PORT });

    wss.on("connection", function connection(ws: any) {
        WSConnection = new WSClientInstance(ws);

        // Once server started and client, connect to mqtt server
        bridgeClient();
    });
}

function bridgeClient() {
    WSConnection._mqttClient = client;
}
