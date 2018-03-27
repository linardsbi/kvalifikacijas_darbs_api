"use strict";

import request from "request";
import async from "async";

import { Response, Request, NextFunction } from "express";
import { default as Topic, TopicInterface as TopicModel } from "../models/Topic";
import { default as Controller, ControllerModel } from "../models/DeviceController";
import { default as Client } from "../models/User";
import {APIResponse} from "../util/helpers/APIResponse";
import {APIResponsePayload, Payload} from "../util/helpers/APIResponsePayload";
import {ErrorHandler} from "../util/helpers/errorHandling";
import {ParseRequest} from "../util/helpers/parseRequest";

let payload = new APIResponsePayload();

// client_id/protocol/room_name/controller_id/sensor_id/?callback

function createNewTopic(topicData: TopicModel): any {
    async.waterfall([
        function getControllerBySensorID(done: Function) {
            console.log(topicData["_sensorID"]);

            Controller.findById({"": topicData._sensorID}, '_id', (err, controller) => {
                if (err || !controller)
                    payload.addUnformattedData({ error: "An error occurred while getting controller id" });
                else {
                    topicData._controllerID = controller._id;
                    done();
                }
            });
        },
        function getClientByControllerID(controller, done: Function) {
            Client.findById(topicData._controllerID, "_id", (err, client) => {
                if (err || !client)
                    payload.addUnformattedData({ error: "An error occurred while getting client id" });
                else
                    topicData._clientID = client._id;

                done();
            });
        },
        function saveTopic(controller, done: Function) {
            try {
                const topic = new Topic({
                    "_clientID": topicData._clientID,
                    "protocol_name": topicData.protocol_name,
                    "details": (topicData.details) ? topicData.details : "generic",
                    "_controllerID": topicData._controllerID,
                    "_sensorID": topicData._sensorID,
                });

                const result = topic.save(function (err, topic) {
                    if (err) {
                        ErrorHandler.handle(err);
                        payload.addUnformattedData({ error: "Error occurred while saving" });
                        done();
                    }
                    payload.addUnformattedData({ topic: topic });
                    done();
                });

            } catch (e) {
                payload.addUnformattedData({ error: e });
                done();
            }
        },
        function updateControllerWithTopic() {

        }
    ], () => {
        return payload.getFormattedPayload();
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

    const result = createNewTopic(topic);
    console.log(result);

    if (!result.errors[0]) response.sendSuccess(result);
    else response.sendError(result);

    payload = new APIResponsePayload();
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


