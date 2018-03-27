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
    return new Promise( (resolve) => {
        const device = new Device({
            "name": deviceData.name,
            "machine_name": deviceData.machine_name,
            "_controllerID": deviceData._controllerID
        });

        async.waterfall([
            function (done: Function) {
                device.save(function (err, device) {
                    if (err) {
                        ErrorHandler.handle(err);
                        payload.addUnformattedData({ error: "Error occurred while saving" });
                        done();
                    }
                    payload.addUnformattedData({ device: device });
                    done(null, device);
                });
            },
            function (device, done: Function) {
                try {
                    Controller.findById(deviceData._controllerID, (err, controller) => {
                        controller.devices.push({ _id: device._id });
                        controller.save(function (err, saved) {
                            if (err)
                                payload.addUnformattedData({ error: err });
                            console.log(err);
                            done();
                        });
                    });
                } catch (e) {
                    payload.addUnformattedData({ error: e });
                    done();
                }
            }
        ], () => {
            resolve(payload.getFormattedPayload());
        });
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

    createNewDevice(device).then( (result) => {
        console.log(result);
        response.sendSuccess(result);
        payload = new APIResponsePayload();
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

