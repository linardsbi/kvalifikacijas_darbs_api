"use strict";

import request from "request";
import async from "async";

import { Response, Request, NextFunction } from "express";
import { default as Topic, TopicModel } from "../models/Topic";
import { default as Controller, ControllerModel } from "../models/DeviceController";
import { default as Client } from "../models/User";
import {APIResponse} from "../util/helpers/APIResponse";
import {APIResponsePayload, Payload} from "../util/helpers/APIResponsePayload";
import {ErrorHandler} from "../util/helpers/errorHandling";
import {ParseRequest} from "../util/helpers/parseRequest";

let payload = new APIResponsePayload();

// client_id/protocol/room_name/controller_id/sensor_id/?callback

function createNewTopic(topicData: TopicModel): any {
    return new Promise( (resolve, reject) => {
        async.waterfall([
            function getControllerBySensorID(done: Function) {
                console.log(topicData._sensorID);
                Controller.find({ devices: topicData._sensorID}, (err, controller) => {
                    if (err)
                        payload.addUnformattedData({ error: err });
                    else if (!controller)
                        payload.addUnformattedData({ error: "No controllers were found with that sensor id" });
                    else
                        topicData._controllerID = controller._id;

                    done(err);
                });
            },
            function getClientByControllerID(done: Function) {
            console.log(topicData._controllerID);
                Client.findById(topicData._controllerID, "_id", (err, client) => {
                    if (err)
                        payload.addUnformattedData({ error: "An error occurred while getting client id" });
                    else if (!client)
                        payload.addUnformattedData({ error: "Controller is not assigned to any clients" });
                    else
                        topicData._clientID = client._id;

                    done(err);
                });
            },
            function saveTopic(done: Function) {
                try {
                    const topic = new Topic({
                        "_clientID": topicData._clientID,
                        "protocol_name": topicData.protocol_name,
                        "details": (topicData.details) ? topicData.details : "generic",
                        "_controllerID": topicData._controllerID,
                        "_sensorID": topicData._sensorID,
                    });

                    topic.save(function (err, topic) {
                        if (err) {
                            ErrorHandler.handle(err);
                            payload.addUnformattedData({ error: err });
                        }
                        payload.addUnformattedData({ topic: topic });
                        done(err, topic);
                    });

                } catch (e) {
                    payload.addUnformattedData({ error: e });
                    done(e);
                }
            },
            function updateControllerWithTopic(topic, done: Function) {
                try {
                    Controller.findById(topicData._controllerID, (err, controller) => {
                        controller.topics.push({ _id: topic._id, details: topicData.details, protocol_name: topicData.protocol_name });
                        controller.save(function (err, saved) {
                            if (err) {
                                payload.addUnformattedData({ error: err });
                            }
                            done(err);
                        });
                    });
                } catch (e) {
                    payload.addUnformattedData({ error: e });
                    done(e);
                }
            }
        ], (err) => {
            if (err) {
                // ErrorHandler.handle(err);
                reject(payload.getFormattedPayload());
            } else
                resolve(payload.getFormattedPayload());
        });
    });
}

/**
 * Handles all the routes associated with the Topic model
 */

/**
 * POST /topics/create
 * Create a new topic.
 * required parameters - sensorID, details(aka. room_name), protocol(aka. arduino/broker)
 * @param {e.Request} req
 * @param {e.Response} res
 */
export const create = (req: Request, res: Response) => {
    const topic: TopicModel = req.body;
    const response = new APIResponse(res);

    createNewTopic(topic).then( (result) => {
        response.sendSuccess(result);

        payload = new APIResponsePayload();
    }).catch( (err) => {
        response.sendError(err);

        payload = new APIResponsePayload();
    });
};

function getTopic(topicID?: string): any {
    return new Promise((resolve, reject) => {
        let topic: any;

        if (topicID) {
            ParseRequest.getValuesFromJSONString(topicID).then( (topicIDs: object) => {
                topic = Topic.find({_id: { $in: topicIDs }}, function (err, found) {
                    if (err) {
                        payload.addUnformattedData({ error: "Error occurred while trying to find a topic"});
                    }
                    payload.addUnformattedData(found);
                    resolve(payload.getFormattedPayload());
                });
            }, (err) => {
                payload.addUnformattedData(err);
                reject(payload.getFormattedPayload());
            });
        } else {
            topic = Topic.find({}, function (err, found) {
                if (err) {
                    payload.addUnformattedData({ error: "Error occurred while trying to find topics" });
                }
                payload.addUnformattedData(found);
                resolve(payload.getFormattedPayload());
            });
        }
    });
}

/**
 * GET /controllers/get
 * Get all or a certain controller.
 * parameters: id - optional
 *
 */
export const read = (req: Request, res: Response) => {
    // TODO: create a nice flow of error handling ops, minimize async ops
    const topicID: string = req.query.id;
    const response = new APIResponse(res);

    getTopic(topicID).then( (result: Payload) => {
        response.sendSuccess(result);
        // Temporary solution
        payload = new APIResponsePayload();
    }, (err) => {
        response.sendError(err);
        // Temporary solution
        payload = new APIResponsePayload();
    });
};


