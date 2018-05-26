"use strict";

import async from "async";
import {default as User, UserModel} from "../models/User";
import {APIResponsePayload} from "../util/helpers/APIResponsePayload";
import {createNewController} from "../controllers/deviceControllers";
import {default as Device, DeviceModel} from "../models/Device";
import {ControllerModel, default as Controller} from "../models/DeviceController";
import {DB} from "../util/helpers/queryHelper";
import {MqttTopicMatch as strmatch} from "../util/helpers/mqttTopicMatch";
import {MongooseDocument} from "mongoose";
import {savePostData} from "./logs";
import Conditional, {ConditionalInterface} from "../models/Conditional";
import {Email} from "../util/helpers/sendEmail";
// import { default as Controller, ControllerModel } from "../models/DeviceController";

const payload = new APIResponsePayload();
let mqttInstance: any;

function handleSys(packet: any) {
    if (packet.topic.search("/\/new\/clients/")) {

    }
}

async function handleFirstConnection(packet: any) {
    const clientID = packet.topic.split("/")[1];
    const username = packet.payload.toString();

    addController(clientID, username).then((result) => {
        console.log("result", result);
    }, (err) => {
        console.log("error", err);
    });
}

function handlePacket(packet: any) {
    console.log("packet received", packet);
}

export function handleClientPublish(packet: any, serverInstance: any) {
    const topic = packet.topic;
    mqttInstance = serverInstance;

    if (strmatch.hasString(topic, "/\$SYS\//")) {
        handleSys(packet);
    } else if (strmatch.hasString(topic, "firstConnection")) {
        handleFirstConnection(packet).catch((reason) => {
            console.log("firstConnection error occurred:", reason);
        });
        console.log("packet received", packet);
    } else if (strmatch.hasString(topic, "/read")) {
        handleIncomingData(packet).catch(reason => {
            console.log("read error occurred:", reason);
        });
    } else if (strmatch.hasString(topic, "/write")) {
        handleDeviceWrite(packet).catch(reason => {
            console.log("write error occurred:", reason);
        });
    } else {
        handlePacket(packet);
    }
}

async function handleDeviceWrite(packet: any) {
    const topic: string = packet.topic;
    const controller = await DB.findOne<ControllerModel>(Controller, {machine_name: topic.split("/")[1]}, "_id");
    const device = await DB.findOne<DeviceModel>(Device, {
        _controllerID: controller.id,
        "used_pins.pin_name": topic.split("/")[5]
    }, "used_pins");
    console.log("write", packet.topic, packet.payload.toString());
    if (device) {
        device.used_pins.lastWrite = packet.payload.toString();

        device.save((err: any) => {
            if (err) return err;
        });
    }
}

export function handleClientSubscribe(topic: string, serverInstance: any) {
    if (strmatch.hasString(topic, "/new")) {
        handleNewDevice(topic, serverInstance).catch(reason => {
            console.log(reason);
        });
    }
}

async function handleIncomingData(packet: any) {
    const topic: string = packet.topic;
    console.log(topic);
    const controller = await DB.findOne<ControllerModel>(Controller, {machine_name: topic.split("/")[1]}, "_id");
    const device = await DB.findOne<DeviceModel>(Device, {
        _controllerID: controller.id,
        "used_pins.pin_name": topic.split("/")[4]
    }, "_id used_pins name");
    const conditionals = await DB.find<ConditionalInterface>(Conditional, {
        "listenSubject.subjectControllerID": controller.id,
        "listenSubject.pin_name": device.used_pins.pin_name
    });

    try {
        handleConditionals(packet, conditionals, device.used_pins.information_type);
    } catch (e) {
        console.log("conditionals error:", e.message);
    }

    const data: any = {
        device: {
            _id: device._id,
            name: device.name || "Pin",
            pin_name: device.used_pins.pin_name
        },
        payload: {
            data_type: device.used_pins.information_type,
            payload_body: packet.payload.toString()
        }
    };

    try {
        const result = await savePostData(data);
    } catch (e) {
        console.log("error occurred:", e);
    }
}

async function handleConditionals(packet: any, conditionals: ConditionalInterface[], info_type: string) {
    const payload = packet.payload.toString();

    for (const conditional of conditionals) {
        const condition = conditional.triggerOn.condition;
        let send = false;

        if (condition === "lt" && payload < conditional.triggerOn.value[0]) send = true;
        if (condition === "gt" && payload > conditional.triggerOn.value[0]) send = true;
        if (condition === "equals" && payload === conditional.triggerOn.value[0]) send = true;
        if (condition === "equals" && payload > conditional.triggerOn.value[0] && payload > conditional.triggerOn.value[1]) send = true;

        if (send) {
            runConditionals(conditional, payload, info_type).catch((err) => {
                console.log("error while running conditionals", err);
            });
        } else {
            console.log(payload, condition, conditional.triggerOn.value[0], "not met");
        }
    }
}

async function runConditionals(conditional: any, payload: string, info_type: string) {
    for (const runObject of conditional.run) {
        switch (runObject.action) {
            case "email":
                console.log("send email with", payload, "to", runObject.subjects);
                for (const subject of runObject.subjects) {
                    try {
                        sendEmail(payload, subject, conditional.listenSubject.pin_name);
                    } catch (e) {
                        console.log(e.message);
                    }
                }
                break;
            case "textMessage":
                console.log("send text with", payload, "to", runObject.subjects);
                break;
            case "write":
                console.log("write", runObject.value, "to pins", runObject.subjects);
                publishWrite(conditional.listenSubject.subjectControllerID, info_type, conditional.listenSubject.pin_name, runObject.value)
                    .catch((err) => {
                        console.log("error while publishing data: ", err);
                    });
                break;
        }
    }
}

function sendEmail(payload: string, email: string, pin_name: string) {
    Email
        .from("admin@site.com")
        .to(email)
        .subject("Home automation event")
        .text(`An event just occurred to ${pin_name}: the value - ${payload}`)
        .send(function (err: undefined | string[]) {
            if (err)
                throw new Error("Email error");
        });
}

async function publishWrite(machine_name: string, info_type: string, pin_name: string, payload: string) {
    const topic = `controllers/${machine_name}/write/device/${info_type}/${$(this).attr("id")}`;
    await publishToTopic(topic, payload);
}

function publishToTopic(topic: string, body: string) {
    return new Promise((resolve) => {
        mqttInstance.publish({
            topic: topic,
            payload: new Buffer(body),
            qos: 1
        }, undefined, function done() {
            resolve();
        });
    });
}

async function handleNewDevice(topic: string, serverInstance: any) {
    const clientID = topic.split("/")[1];

    const controller = await DB.findOne<ControllerModel>(Controller, {machine_name: clientID});

    if (controller) {
        const devices = await DB.find<DeviceModel>(Device, {_controllerID: controller.id});
        if (devices[0]) {
            for (const item of devices) {
                const message = {
                    topic: `controllers/${clientID}/new/device/${item.used_pins.information_type}/${item.used_pins.pin_mode}/${item.machine_name}/${item.used_pins.pin_name}`,
                    payload: item.id,
                    retain: true
                };
                serverInstance.publish(message);
            }
        } else {
            console.log("Controller had no devices");
        }
    }

}

export function addController(clientID: string, username: string) {
    return new Promise((resolve, reject) => {
        async.waterfall([
            function checkIfControllerBelongsToUser(cb: Function) {
                User.findOne({"controllers.machine_name": clientID}, "_id", (err, found: UserModel) => {
                    if (err) cb(err, true);
                    if (!found)
                        cb(undefined, true);
                    else
                        cb(undefined, "exists");
                });
            },
            function addToUserControllers(user: any, cb: Function) {
                // If a user is authenticated and doesn't have the particular controller, create a new one
                if (user && user !== "exists") {
                    User.findOne({email: username}, (err, user) => {
                        if (err) cb(undefined);
                        else {
                            const controller = {
                                name: clientID.split("_")[0],
                                machine_name: clientID,
                                _client_id: user._id
                            };
                            cb(undefined, controller);
                        }
                    });
                } else if (user === "exists")
                    cb(undefined, user);
                else
                    cb(undefined);
            }
        ], (err, result: any) => {
            if (err) {
                payload.addUnformattedData(err);
                reject(payload.getFormattedPayload());
            } else if (result === "exists") {
                resolve(payload.getFormattedPayload());
            } else if (result) {
                createNewController(result).then(() => {
                    resolve(payload.getFormattedPayload());
                }, () => {
                    reject(payload.getFormattedPayload());
                });
            } else {
                reject(payload.getFormattedPayload());
            }
        });
    });
}

export function authenticate(clientID: string, username: string, password: string) {
    return new Promise((resolve, reject) => {
        async.waterfall([
            function checkCredentials(cb: Function) {
                User.findOne({email: username.toLowerCase()}, (err, user: UserModel) => {
                    if (err) cb({error: err}, undefined);
                    if (!user)
                        cb({error: "invalid username or password"}, undefined);
                    else {
                        user.comparePassword(password, (err: Error, isMatch: boolean): any => {
                            if (err) cb({error: err}, undefined);

                            if (isMatch)
                                cb(undefined, user);
                            else
                                cb({error: "invalid username or password"}, undefined);
                        });
                    }
                });
            }
        ], (err) => {
            if (err) {
                payload.addUnformattedData(err);
                reject(payload.getFormattedPayload());
            } else resolve(payload.getFormattedPayload());
        });
    });
}





