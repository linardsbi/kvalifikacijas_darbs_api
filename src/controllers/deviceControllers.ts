"use strict";

import async, { reject } from "async";
import request from "request";

import { Response, Request, NextFunction } from "express";
import {default as Controller, Controller as ControllerInterface, ControllerModel } from "../models/DeviceController";
import {default as Topic } from "../models/Topic";
import {default as Sensor } from "../models/Device";
import {default as PublishedData } from "../models/PublishedData";
import { ObjectID } from "bson";
import { ParseRequest } from "../util/helpers/parseRequest";
import { ErrorHandler } from "../util/helpers/errorHandling";
import { APIResponsePayload, Payload } from "../util/helpers/APIResponsePayload";
import { APIResponse } from "../util/helpers/APIResponse";

let payload = new APIResponsePayload();

function createNewController(controllerData: ControllerModel): any {
    return new Promise(function (resolve, reject) {
        const controller = new Controller();

        if (controllerData.name && controllerData.machine_name) {
            controller.name = controllerData.name;
            controller.machine_name = controllerData.machine_name;
        } else {
            payload.addUnformattedData({error: "Required parameters name or machine_name are missing"});
            reject(payload.getFormattedPayload());
        }

        try {
            const result = controller.save(function (err, controller) {
                if (err) {
                    ErrorHandler.handle(err);
                    payload.addUnformattedData({ error: new Error("Error occurred while saving") });
                    reject(payload.getFormattedPayload());
                }
                payload.addUnformattedData({ controller: controller });
                resolve(payload.getFormattedPayload());
            });

        } catch (e) {
            payload.addUnformattedData({ error: new Error("Error occurred while parsing string") });
            reject(payload.getFormattedPayload());
        }
    });
}

/**
 * Handles all the routes associated with the DeviceController model
 */
export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    // TODO: auth check
    next();
};

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

function getController(controllerID?: string): any {
    return new Promise((resolve, reject) => {
        let controller: any;

        if (controllerID) {
            ParseRequest.getValuesFromJSONString(controllerID).then( (controllerIDs: object) => {
                controller = Controller.find({_id: { $in: controllerIDs }}, function (err, found) {
                    if (err) {
                        payload.addUnformattedData({ error: "Error occurred while trying to find a controller"});

                    }
                    payload.addUnformattedData(found);
                    resolve(payload.getFormattedPayload());
                });
            }, (err) => {
                payload.addUnformattedData(err);
                reject(payload.getFormattedPayload());
            });
        } else {
            controller = Controller.find({}, function (err, found) {
                if (err) {
                    payload.addUnformattedData({ error: "Error occurred while trying to find controllers" });
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
    const controllerID: string = req.query.id;
    const response = new APIResponse(res);

    getController(controllerID).then( (result: Payload) => {
        response.sendSuccess(result);
        // Temporary solution
        payload = new APIResponsePayload();
    }, (err) => {
        response.sendError(err);
        // Temporary solution
        payload = new APIResponsePayload();
    });
};

function getTopicsByControllerID(controllerID: ObjectID): any {
    return new Promise( (resolve, reject) => {
        const topic = Topic.find({_controllerID: controllerID}, function (err, found) {
            if (err) {
                payload.addUnformattedData({error: "error occurred while getting topics"});
                reject();
            }
            payload.addUnformattedData(found);
            resolve(payload.getFormattedPayload());
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
        getTopicsByControllerID(controllerID).then( (result: Payload) => {
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
 * GET /controllers/get/sensors
 * Get all sensors of a certain controller.
 * parameters: controller id
 *
 */
export let getControllerSensors = (req: Request, res: Response) => {
    let controller: object;
    let sensors: object;
    const controllerID = req.body.id;
    if (controllerID) {
        controller = Controller.findOne({id: req.body.id}, function (err) {
            if (err) res.send("error");
        });

        sensors = Sensor.find({_controllerID: controller.id}, function (err, found) {
            if (err) res.send("error");
            returnResponse(res, found, err);
        });
    }
};

/**
 * GET /controllers/get/topics
 * Get data that came from devices connected to a specific controller
 * parameters:
 *             extra parameters {
 *                  	datetime: String,
 *                      controllerIDs: ObjectID,
 *                      clientIDs: ObjectID,
 *                      topicName: String,
 *             }
 */
export let getControllerData = (req: Request, res: Response) => {
    // TODO: handle extra parameters
    let controller: object;
    let data: object;
    const controllerID = req.body.id;
    if (controllerID) {
        controller = Controller.findOne({id: req.body.id}, function (err) {
            if (err) res.send("error");
        });

        data = PublishedData.find({_controllerID: controller.id}, function (err, found) {
            if (err) res.send("error");
            returnResponse(res, found, err);
        });
    }
};

/**
 * GET /controllers/edit
 * Get all sensors of a certain controller.
 * parameters: controller id, update parameters
 *
 */
export let editController = (req: Request, res: Response) => {
    // TODO: request body to update parameters
    let controller: any;
    const update: object = req.body;
    const controllerID = req.body.id;
    if (controllerID) {
        controller = Controller.findByIdAndUpdate({id: req.body.id}, update, function (err) {
            if (err) res.send("error");
        });
    }
};

/**
 * GET /controllers/delete
 * Get delete a certain controller
 * parameters: controller id
 *
 */
export let deleteController = (req: Request, res: Response) => {
    let controller: any;
    const controllerID = req.body.id;
    if (controllerID) {
        controller = Controller.findByIdAndRemove({id: req.body.id}, function (err) {
            if (err) res.send("error");
        });
    }
};