"use strict";
import {ParseRequest as parse} from "../util/helpers/parseRequest";
import {JwtToken as token} from "../util/helpers/jwtToken";

/**
 * TODO: create more efficient topics so the bridge client doesn't have to sub to many topics
 * (ideal condition: only one topic to sub to needed for the client to know about the present controllers)
 */
class BridgeInstance {
    instance: any;

    constructor(instance: any) {
        this.instance = instance;
    }
}

export class WSClientInstance extends BridgeInstance {
    private _mqttClient: any;
    private response: object = {};

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
        message = parse.toObject(message);

        this.validateAPIToken(message.apiToken).then(() => {
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
        }, () => {
            this.response.error = "Invalid API key";
        });

        this.returnResponse();
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
        this.instance.send(JSON.stringify(this.response));
    }

    private validateAPIToken(apiToken: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const result = await token.checkIfTokenAssigned(apiToken);
            if (result) resolve(true);
            else reject(false);
        });
    }

    private formatMqttMessage(message: any) {
        // TODO: any needed formatting
        return message;
    }

    private mqttListen(instance: any) {
        const that = this;

        instance.on('message', function (topic: string, message: Buffer) {
            console.log(topic);
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

    constructor(client: any) {
        super(client);
    }

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