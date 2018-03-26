"use strict";

import async from "async";
import request from "request";

import { Response, Request, NextFunction } from "express";
import { default as Device, DeviceInterface as DeviceModel } from "../models/Device";
import {APIResponse} from "../util/helpers/APIResponse";
import {ControllerModel, default as Controller} from "../models/DeviceController";
import {APIResponsePayload, Payload} from "../util/helpers/APIResponsePayload";
import {ErrorHandler} from "../util/helpers/errorHandling";
import {ParseRequest} from "../util/helpers/parseRequest";


let payload = new APIResponsePayload();

function createNewDevice(deviceData: DeviceModel): any {
    return new Promise(function (resolve, reject) {
        const device = new Device();

        if (deviceData.name && deviceData.machine_name && deviceData._controllerID) {
            device.name = deviceData.name;
            device.machine_name = deviceData.machine_name;
            device._controllerID = deviceData._controllerID;
        } else {
            payload.addUnformattedData({error: "Required parameters name, machine_name or controllerID are missing"});
            reject(payload.getFormattedPayload());
        }

        try {
            const result = device.save(function (err, device) {
                if (err) {
                    ErrorHandler.handle(err);
                    payload.addUnformattedData({ error: new Error("Error occurred while saving") });
                    reject(payload.getFormattedPayload());
                }
                payload.addUnformattedData({ controller: device });
                resolve(payload.getFormattedPayload());
            });

        } catch (e) {
            payload.addUnformattedData({ error: new Error("Error occurred while parsing string") });
            reject(payload.getFormattedPayload());
        }
    });
}

/**
 * Handles all the routes associated with the Device model
 */

/**
 * POST /devices/create
 * Create a new device.
 * @param {e.Request} req
 * @param {e.Response} res
 */
export const create = (req: Request, res: Response) => {
    const device: DeviceModel = req.body;
    const response = new APIResponse(res);

    createNewDevice(device).then(function (result) {
        response.sendSuccess(result);
        // Temporary solution
        new APIResponsePayload();
    }, (err) => {
        response.sendError(err);
        // Temporary solution
        new APIResponsePayload();
    });
};

function getDevice(deviceID?: string): any {
    return new Promise((resolve, reject) => {
        let device: any;

        if (deviceID) {
            ParseRequest.getValuesFromJSONString(deviceID).then( (deviceIDs: object) => {
                device = Device.find({_id: { $in: deviceIDs }}, function (err, found) {
                    if (err) {
                        payload.addUnformattedData({ error: "Error occurred while trying to find a device"});
                    }
                    payload.addUnformattedData(found);
                    resolve(payload.getFormattedPayload());
                });
            }, (err) => {
                payload.addUnformattedData(err);
                reject(payload.getFormattedPayload());
            });
        } else {
            device = Device.find({}, function (err, found) {
                if (err) {
                    payload.addUnformattedData({ error: "Error occurred while trying to find devices" });
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
    const deviceID: string = req.query.id;
    const response = new APIResponse(res);

    getDevice(deviceID).then( (result: Payload) => {
        response.sendSuccess(result);
        // Temporary solution
        payload = new APIResponsePayload();
    }, (err) => {
        response.sendError(err);
        // Temporary solution
        payload = new APIResponsePayload();
    });
};

