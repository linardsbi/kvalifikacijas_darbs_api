"use strict";

import async from "async";

import {Request, Response} from "express";
import {default as Topic, TopicModel} from "../models/Topic";
import {ControllerModel, default as Controller} from "../models/DeviceController";
import {default as Client} from "../models/User";
import {APIResponse} from "../util/helpers/APIResponse";
import {APIResponsePayload, Payload} from "../util/helpers/APIResponsePayload";
import {ErrorHandler} from "../util/helpers/errorHandling";
import {ParseRequest} from "../util/helpers/parseRequest";
import {APIController} from "./APIController";

let payload = new APIResponsePayload();

// controllers/<controller_machine_name>/<action>/<subject>

function createNewTopic(topicData: TopicModel): any {
    return new Promise((resolve, reject) => {
        async.waterfall([
            function getControllerBySensorID(done: Function) {
                Controller.find({devices: topicData._sensorID}, "_id _client_id", (err, controller: ControllerModel) => {
                    if (err)
                        payload.addUnformattedData({error: err});
                    else if (!controller)
                        payload.addUnformattedData({error: "No controllers were found with that sensor id"});
                    else {
                        topicData._controllerID = controller[0]._id;
                        topicData._clientID = controller[0]._client_id;
                    }

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

                    topic.save(function (err, topic: TopicModel) {
                        if (err) {
                            ErrorHandler.handle(err);
                            payload.addUnformattedData({error: err});
                        }
                        payload.addUnformattedData({topic: topic});
                        console.log(topic.full_name);
                        done(err, topic);
                    });

                } catch (e) {
                    payload.addUnformattedData({error: e});
                    done(e);
                }
            },
            function updateControllerWithTopic(topic: TopicModel, done: Function) {
                try {
                    Controller.findById(topicData._controllerID, (err, controller: ControllerModel) => {
                        controller.topics.push({
                            _id: topic._id,
                            details: topicData.details,
                            protocol_name: topicData.protocol_name
                        });
                        controller.save(function (err, saved) {
                            if (err) {
                                payload.addUnformattedData({error: err});
                            }
                            done(err);
                        });
                    });
                } catch (e) {
                    payload.addUnformattedData({error: e});
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
    // TODO: rework, so topic names can be logged with the corresponding data
export const create = (req: Request, res: Response) => {
    const topic: TopicModel = req.body;
    const response = new APIResponse(res);

    createNewTopic(topic).then((result) => {
        response.sendSuccess(result);

        payload = new APIResponsePayload();
    }).catch((err) => {
        response.sendError(err);

        payload = new APIResponsePayload();
    });
};

/**
 * GET /topics/get
 * Get all or a certain controller.
 * parameters: id - optional
 *
 */
export const read = (req: Request, res: Response) => {
    const topicID: string = req.query.id;
    const api = new APIController(res, Topic);

    api.read(topicID);
};

/**
 * PATCH /topics/edit
 * Get all sensors of a certain controller.
 * parameters: controller id, update parameters
 *
 */
export let update = (req: Request, res: Response) => {
    const parameters: ControllerModel = req.body;
    const api = new APIController(res, Topic);

    api.update(parameters);
};

/**
 * GET /controllers/delete
 * Get delete a certain controller
 * parameters: controller id
 *
 */
export let remove = (req: Request, res: Response) => {
    const topicID: string = req.body;
    const api = new APIController(res, Topic);

    api.remove(topicID);
};


