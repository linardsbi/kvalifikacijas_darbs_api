"use strict";
import {ParseRequest as parse } from "../util/helpers/parseRequest";
import {JwtToken as token } from "../util/helpers/jwtToken";
import mqtt from "mqtt";
import WebSocket from "ws";
/**
 * TODO: create more efficient topics so the bridge client doesn't have to sub to many topics
 * (ideal condition: only one topic to sub to needed for the client to know about the present controllers)
 */

interface BridgeResponse {
    item: string;
    id: string;
    status: string;
    error: string;
    data: string;
}

class BridgeInstance {
    instance: any;

    constructor(instance: any) {
        this.instance = instance;
    }
}

export class WSClientInstance extends BridgeInstance {
    private _mqttClient: any;
    private response: BridgeResponse;

    constructor(instance: any) {
        super(instance);

        this.response = {
            item: "",
            id: "",
            status: "initializing",
            error: "",
            data: ""
        };

        this.listen();
    }

    listen() {
        const that = this;

        this.instance.on("message", function incoming(message: any) {
            that.handleMessage(message);
        });

        this.instance.on("error", function incoming(err: any) {
            this.response.error = err.toString();
            console.error("error occurred:", err.toString());
            this.returnResponse();
        });
    }

    private handleMessage(message: any) {
        message = parse.toObject(message);

        this.validateAPIToken(message.apiToken).then(async () => {
            const that = this;
            this._mqttClient = await setupMqttClient();

            if (!(this._mqttClient instanceof Error)) {
                this._mqttClient.on("message", (topic: string, message: Buffer) => {
                    that.response = this.formatMqttMessage(topic, message);
                    that.returnResponse();
                });

                switch (message.action) {
                    case "subscribe":
                        this.handleSubscribe(message.topics);
                        break;
                    case "publish":
                        this.handlePublish(message.topic, message.payload, message.options);
                        console.log(message.payload.toString());
                        break;
                    default:
                        this.response.error = "No action specified";
                }
            } else {
                this.response.error = this._mqttClient.message;
                this.returnResponse();
            }
        }, () => {
            this.response.error = "Invalid API key";
            this.returnResponse();
        });
    }

    private handleSubscribe(topics: object) {
        // TODO: handling logic
        this._mqttClient.subscribe(topics);
    }

    private handlePublish(topic: object, message: object, options?: object) {
        // TODO: handling logic
        this._mqttClient.publish(topic, message, options);
    }

    private returnResponse() {
        if (WebSocket && this.instance.readyState === WebSocket.OPEN) {
            this.instance.send(JSON.stringify(this.response));
        } else {
            console.log("connection closed abruptly");
            this._mqttClient.end();
        }
    }

    private validateAPIToken(apiToken: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const result = await token.checkIfTokenAssigned(apiToken);
            if (result) resolve(true);
            else reject(false);
        });
    }

    private formatMqttMessage(topic: string, message: any): BridgeResponse  {
        // TODO: any needed formatting
        const formatted: BridgeResponse = this.response;
        const msgString = message.toString();

        if (topic.split("/")[2] === "presence") {
            formatted.item = "controller";
            formatted.id = topic.split("/")[1];

            if (msgString === "1") {
                formatted.status = "connected";
            } else {
                formatted.status = "disconnected";
            }
        } else if (topic.split("/")[2] === "read" && topic.split("/")[3] === "device") {
            formatted.item = `device`;
            formatted.data = msgString;
            formatted.id = topic.split("/")[4];
        }

        return formatted;
    }

    set mqttClient(instance: any) {
        this._mqttClient = instance;
    }

    get mqttClient(): any {
        return this._mqttClient;
    }
}
function setupMqttClient() {
    return new Promise((resolve, reject) => {
        const client = mqtt.connect(`mqtt://localhost:${parseInt(process.env.MQTT_PORT)}`);
        client.on("connect", () => {
            resolve(client);
        });
        client.on("error", (e: any) => {
            reject(new Error(e));
        });
    });
}
// export class MQTTClientInstance extends BridgeInstance {
//     private _wsClient: any;
//
//     constructor(client: any) {
//         super(client);
//     }
//
//     listen() {
//         this.instance.on("connect", function () {
//             this.handleConnect();
//         });
//
//         this.instance.on("message", function (topic: string, message: Buffer) {
//             this.handleMessage(topic, message);
//         });
//     }
//
//     private handleConnect() {
//
//     }
//
//     private handleMessage(topic: string, message: Buffer) {
//
//     }
//
//     doSubscribe(topic) {
//
//     }
//
//     doPublish(topic, payload) {
//
//     }
//
//     set wsClient(instance: any) {
//         this._wsClient = instance;
//     }
//
//     get wsClient(): any {
//         return this._wsClient;
//     }
// }