"use strict";

import async, {reject} from "async";
import request from "request";

import { Response, Request, NextFunction } from "express";
import { default as Device, DeviceModel } from "../models/Device";
import {APIResponse} from "../util/helpers/APIResponse";
import {ControllerModel, default as Controller} from "../models/DeviceController";
import {APIResponsePayload, Payload} from "../util/helpers/APIResponsePayload";
import {ErrorHandler} from "../util/helpers/errorHandling";
import {ParseRequest} from "../util/helpers/parseRequest";


let payload = new APIResponsePayload();

function createNewDevice(deviceData: DeviceModel): any {
    return new Promise( (resolve, reject) => {
        const device = new Device({
            "name": deviceData.name,
            "machine_name": deviceData.machine_name,
            "_controllerID": deviceData._controllerID,
            "used_pins": deviceData.used_pins
        });

        async.waterfall([
            function saveDevice(done: Function) {
                device.save(function (err, device: DeviceModel) {
                    if (err) {
                        payload.addUnformattedData({ error: err });
                    }
                    payload.addUnformattedData({ device: device });
                    done(err, device);
                });
            },
            function updateControllerWithNewDeviceInfo(device: DeviceModel, done: Function) {
                try {
                    Controller.findById(deviceData._controllerID, (err, controller: ControllerModel) => {
                        controller.devices.push(device._id);
                        controller.save(function (err) {
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
                ErrorHandler.handle(err);
                reject(payload.getFormattedPayload());
            } else
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
        response.sendSuccess(result);

        payload = new APIResponsePayload();
    }).catch( (err) => {
        response.sendError(err);

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

