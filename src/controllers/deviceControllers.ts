"use strict";

import async from "async";

import {NextFunction, Request, Response} from "express";
import {ControllerModel, default as Controller} from "../models/DeviceController";
import {default as Topic, TopicModel} from "../models/Topic";
import {default as Device, DeviceModel} from "../models/Device";
import {default as PublishedData, PublishedDataModel} from "../models/PublishedData";
import {default as User, UserModel} from "../models/User";
import { APIController } from "./APIController";

import { ParseRequest } from "../util/helpers/parseRequest";
import { ErrorHandler } from "../util/helpers/errorHandling";
import { APIResponsePayload, Payload } from "../util/helpers/APIResponsePayload";
import { APIResponse } from "../util/helpers/APIResponse";

let payload = new APIResponsePayload();

export function createNewController(controllerData: ControllerModel): any {
    return new Promise(function (resolve, reject) {
        async.waterfall([
            function saveController(done: Function) {
                const controller = new Controller({
                    "name": controllerData.name,
                    "machine_name": controllerData.machine_name,
                    "_client_id": controllerData._client_id
                });

                try {
                    controller.save((err, controller: ControllerModel) => {
                        if (err) {
                            ErrorHandler.handle(err);
                            payload.addUnformattedData({error: err});
                        }
                        payload.addUnformattedData({controller: controller});
                        done(err, controller);
                    });

                } catch (e) {
                    payload.addUnformattedData({error: e});
                    done(e);
                }
            },
            function addControllerToClient(controller: ControllerModel, done: Function) {
                try {
                    User.findById(controllerData._client_id, (err, user: UserModel) => {
                        if (user) {
                            user.controllers.push({
                                _id: controller._id,
                                machine_name: controller.machine_name
                            });
                            user.save((err, found) => {
                                console.log(user, err, found);
                                if (err) {
                                    payload.addUnformattedData({error: err});
                                }
                            });

                        } else {
                            payload.addUnformattedData({error: "no client was found by that id"});
                        }
                        done(err);
                    });
                } catch (e) {
                    payload.addUnformattedData({error: e});
                    done(e);
                }
            }
        ], (err) => {
            if (err) {
                ErrorHandler.handle(err);
                reject(payload.getFormattedPayload());
            } else
                resolve(payload.getFormattedPayload());
        });
    });
}

/**
 * POST /controllers/create
 * Create a new controller.
 * @param {e.Request} req
 * @param {e.Response} res
 */
export const create = (req: Request, res: Response) => {
    const controller: ControllerModel = req.body;
    const response = new APIResponse(res);

    createNewController(controller).then(function (result) {
        response.sendSuccess(result);
        // Temporary solution
        payload = new APIResponsePayload();
    }, (err) => {
        response.sendError(err);
        // Temporary solution
        payload = new APIResponsePayload();
    });
};

function getTopicsByControllerID(controllerID: string): any {
    return new Promise((resolve, reject) => {
        ParseRequest.getValuesFromJSONString(controllerID).then((controllerIDs: object) => {
            Topic.find({_controllerID: {$in: controllerIDs}}, function (err, topic: TopicModel) {
                if (err) {
                    payload.addUnformattedData({error: err});
                    reject(payload.getFormattedPayload());
                }

                payload.addUnformattedData(topic);
                resolve(payload.getFormattedPayload());
            });
        });
    });
}

/**
 * GET /controllers/get/topics
 * Get all topics of a certain controller.
 * parameters: controller id
 *
 */
export const getControllerTopics = (req: Request, res: Response) => {
    const controllerID = req.query.id;
    const response = new APIResponse(res);

    if (controllerID) {
        getTopicsByControllerID(controllerID).then((result: Payload) => {
            response.sendSuccess(result);
            // Temporary solution
            payload = new APIResponsePayload();
        }, (err) => {
            response.sendError(err);
            // Temporary solution
            payload = new APIResponsePayload();
        });
    }
};

function getControllerDevicesByID(controllerID: string) {
    return new Promise((resolve, reject) => {
        ParseRequest.getValuesFromJSONString(controllerID).then((controllerIDs: object) => {
            Device.find({_controllerID: {$in: controllerIDs}}, function (err, device: DeviceModel) {
                if (err) {
                    payload.addUnformattedData({error: err});
                    reject(payload.getFormattedPayload());
                }

                payload.addUnformattedData(device);
                resolve(payload.getFormattedPayload());
            });
        });
    });
}

/**
 * GET /controllers/get/sensors
 * Get all sensors of a certain controller.
 * parameters: controller id
 *
 */
export let getControllerDevices = (req: Request, res: Response) => {
    const controllerID = req.query.id;
    const response = new APIResponse(res);

    if (controllerID) {
        getControllerDevicesByID(controllerID).then((result: Payload) => {
            response.sendSuccess(result);
            // Temporary solution
            payload = new APIResponsePayload();
        }, (err) => {
            response.sendError(err);
            // Temporary solution
            payload = new APIResponsePayload();
        });
    }
};

function getControllerDataByID(controllerID: string, parameters: string) {
    return new Promise((resolve, reject) => {
        async.waterfall([
            function parseParameters(next: Function) {
                ParseRequest.getValuesFromJSONString(parameters).then((formattedParameters: object) => {
                    console.log(formattedParameters);
                    next(null, formattedParameters);
                });
            },
            function parseControllerIDs(formattedParameters: object, next: Function) {
                ParseRequest.getValuesFromJSONString(controllerID).then((controllerIDs: object) => {
                    next(null, formattedParameters, controllerIDs);
                });
            },
            function getData(formattedParameters: object, controllerIDs: object, done: Function) {
                PublishedData.find({_controllerID: {$in: controllerIDs}}, function (err, published: PublishedDataModel) {
                    if (err) {
                        payload.addUnformattedData({error: err});
                        done(err);
                    }
                    payload.addUnformattedData(published);
                    done();
                });
            }
        ], (err) => {
            if (err) {
                ErrorHandler.handle(err);
                reject(payload.getFormattedPayload());
            } else
                resolve(payload.getFormattedPayload());
        });
    });
}

/**
 * GET /controllers/get/data
 * Get data that came from devices connected to a specific controller
 * parameters:
 *             extra parameters {
 *                  	datetime: String,
 *                      clientIDs: ObjectID,
 *                      topicName: String,
 *             }
 */
export let getControllerData = (req: Request, res: Response) => {
    const controllerID = req.query.id;
    const parameters = req.query.parameters;
    const response = new APIResponse(res);

    if (controllerID) {
        getControllerDataByID(controllerID, parameters).then((result: Payload) => {
            response.sendSuccess(result);
            // Temporary solution
            payload = new APIResponsePayload();
        }, (err) => {
            response.sendError(err);
            // Temporary solution
            payload = new APIResponsePayload();
        });
    }
};

/**
 * GET /controllers/get
 * Get all or a certain controller.
 * parameters: id - optional
 *
 */
export const read = (req: Request, res: Response) => {
    const controllerID: string = req.query.id;
    const api = new APIController(res, Controller);

    api.read(controllerID);
};

/**
 * GET /controllers/edit
 * Get all sensors of a certain controller.
 * parameters: controller id, update parameters
 *
 */
export let update = (req: Request, res: Response) => {
    const parameters: ControllerModel = req.body;
    const api = new APIController(res, Controller);

    api.update(parameters);
};

/**
 * GET /controllers/delete
 * Get delete a certain controller
 * parameters: controller id
 *
 */
export let remove = (req: Request, res: Response) => {
    const controllerID: string = req.body;
    const api = new APIController(res, Controller);

    api.remove(controllerID);
};