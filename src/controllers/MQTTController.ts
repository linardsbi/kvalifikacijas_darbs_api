"use strict";

import async from "async";
import {default as User, UserModel} from "../models/User";
import {APIResponsePayload} from "../util/helpers/APIResponsePayload";
import {createNewController} from "../controllers/deviceControllers";
import {default as Device, DeviceModel} from "../models/Device";
import {ControllerModel, default as Controller} from "../models/DeviceController";
import {DB} from "../util/helpers/queryHelper";
import {MqttTopicMatch as strmatch} from "../util/helpers/mqttTopicMatch";
import {ParseRequest as parse} from "../util/helpers/parseRequest";
import {MongooseDocument} from "mongoose";
// import { default as Controller, ControllerModel } from "../models/DeviceController";

const payload = new APIResponsePayload();

function handleSys(packet) {
    if (packet.topic.search("/\/new\/clients/")) {
    }
}

async function handleFirstConnection(packet) {
    const clientID = packet.topic.split("/")[1];
    const username = packet.payload.toString();

    addController(clientID, username).then((result) => {
        console.log("result", result);
    }, (err) => {
        console.log("error", err);
    });
}

function handlePacket(packet: any) {
    // console.log("packet received", packet);
}

export function handleClientPublish(packet: any, serverInstance: any) {
    const topic = packet.topic;

    if (strmatch.hasString(topic, "/\$SYS\//")) {
        handleSys(packet);
    } else if (strmatch.hasString(topic, "firstConnection")) {
        handleFirstConnection(packet);
        console.log("packet received", packet);
    } else {
        handlePacket(packet);
    }
}

export function handleClientSubscribe(topic: any, serverInstance: any) {
    if (strmatch.hasString(topic, "/new")) {
        handleNewDevice(topic, serverInstance);
    } else {

    }
}

async function handleNewDevice(topic: any, serverInstance: any) {
    const clientID = topic.split("/")[1];

    const controller: MongooseDocument = await DB.findOne(Controller, {machine_name: clientID});

    if (controller) {
        const devices: MongooseDocument[] = await DB.find(Device, {_controllerID: controller.id});
        if (devices[0]) {
            console.log(devices);
            for (const item of devices) {
                for (const pin of item.used_pins) {

                    const message = {
                        topic: `controllers/${clientID}/new/device/${pin.information_type}/${pin.pin_mode}/${item.machine_name}/${pin.pin_name}`,
                        payload: item.id,
                        retain: true
                    };
                    serverInstance.publish(message);
                }
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
        ], (err, result) => {
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





