"use strict";
import {ParseRequest as parse } from "../util/helpers/parseRequest";
import {JwtToken as token } from "../util/helpers/jwtToken";
import mqtt from "mqtt";
import WebSocket from "ws";
import {DB} from "../util/helpers/queryHelper";
import Device from "../models/Device";
import DeviceController from "../models/DeviceController";
/**
 * TODO: create more efficient topics so the bridge client doesn't have to sub to many topics
 * (ideal condition: only one topic to sub to needed for the client to know about the present controllers)
 */

interface BridgeResponse {
    item: string;
    id: string;
    status: string;
    error: string;
    data: object;
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
            data: {}
        };

        this.listen();
    }

    listen() {
        const that = this;

        this.instance.on("message", function incoming(message: any) {
            that.handleMessage(message);
        });

        this.instance.on("close", (code: number, reason: string) => {
            console.log(`connection closed with code ${code} - ${reason}`);
        });

        this.instance.on("error", function incoming(err: any) {
            that.response.error = err.toString();
            console.error("error occurred:", err.toString());
            that.returnResponse();
        });
    }

    private handleMessage(message: any) {
        message = parse.toObject(message);

        this.validateAPIToken(message.apiToken).then(async () => {
            const that = this;
            this._mqttClient = await setupMqttClient();

            if (!(this._mqttClient instanceof Error)) {
                this._mqttClient.on("message", async (topic: string, message: Buffer) => {
                    that.response = await this.formatMqttMessage(topic, message);
                    that.returnResponse();
                });

                switch (message.action) {
                    case "subscribe":
                        this.handleSubscribe(message.topics);
                        break;
                    case "publish":
                        this.handlePublish(message.topic, message.payload, message.options);
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

    private async formatMqttMessage(topic: string, message: any): Promise<BridgeResponse>  {
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

            const controller: any = await DB.findOne(DeviceController, {machine_name: topic.split("/")[1]}, "_id");
            const device: any = DB.findOne(Device, {_controllerID: controller._id, "used_pins.pin_name": topic.split("/")[4]}, "_id name used_pins");

            device.then((result: any) => {
                formatted.data = {
                    payload: msgString,
                    device: {
                        name: result.name,
                        pin_name: result.used_pins.pin_name
                    }
                };
                formatted.id = result._id;
            });

            device.catch((rejection: boolean) => {
                this.response.error = "Device not assigned";
                this.returnResponse();
            });
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
