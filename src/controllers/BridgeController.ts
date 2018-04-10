"use strict";
import mqtt from "mqtt";
import { default as User, UserModel, AuthToken } from "../models/User";

class BridgeInstance {
    instance: any;

    constructor(instance: any) {
        this.instance = instance;
    }
}

export class WSClientInstance extends BridgeInstance {
    private _mqttClient: any;
    private response: object;

    constructor(instance: any) {
        super(instance);
        this.listen();
    }

    listen() {
        const that = this;

        this.instance.on("message", function incoming(message: any) {
            that.handleMessage(message);
        });

        this.instance.on("error", function incoming(err: any) {
            this.response.error = err.toString();
            console.error("error occurred: %s", err.toString());
            this.returnResponse();
        });
    }

    private handleMessage(message: any) {
        console.log(message);
        if (this.validateAPIToken(message.apiToken)) {
            switch (message.action) {
                case "subscribe":
                    this.handleSubscribe(message.topics);
                    break;
                case "publish":
                    this.handlePublish(message.topic, message.payload);
                    break;
                default:
                    this.response.error = "No action specified";
            }
        } else
            this.response.error = "Invalid API key";

        this.returnResponse();
    }

    private handleSubscribe(topics: object) {
        // TODO: handling logic
        this._mqttClient.subscribe(topics);
    }

    private handlePublish(topic: object, message: object) {
        // TODO: handling logic
        this._mqttClient.publish(topic, message);
    }

    private returnResponse() {
        this.instance.send(this.response);
    }

    private validateAPIToken(apiToken: string): boolean {
        User.findOne({apiKey: apiToken}, (err, result) => {
            if (err) return false;
            return !!(result);
        });
    }

    private formatMqttMessage(message: any) {
        // TODO: any needed formatting
        return message;
    }

    private mqttListen(instance: any) {
        const that = this;

        instance.on('message', function (topic: string, message: Buffer) {
            that.response = that.formatMqttMessage(message);
            that.returnResponse();
        });
    }

    set mqttClient(instance: any) {
        this.mqttListen(instance);
        this._mqttClient = instance;
    }
    get mqttClient(): any {
        return this._mqttClient;
    }
}

export class MQTTClientInstance extends BridgeInstance {
    private _wsClient: any;
    constructor(client: any) { super(client) }
    listen() {
        this.instance.on('connect', function () {
            this.handleConnect();
        });

        this.instance.on('message', function (topic: string, message: Buffer) {
            this.handleMessage(topic, message);
        });
    }
    private handleConnect() {

    }
    private handleMessage(topic: string, message: Buffer) {

    }
    doSubscribe(topic) {

    }
    doPublish(topic, payload) {

    }
    set wsClient(instance: any) {
        this._wsClient = instance;
    }
    get wsClient(): any {
        return this._wsClient;
    }
}