"use strict";

import async from "async";

import { Request, Response } from "express";
import {default as Device, DeviceModel } from "../models/Device";
import { APIResponse } from "../util/helpers/APIResponse";
import { ControllerModel, default as Controller } from "../models/DeviceController";
import { APIResponsePayload } from "../util/helpers/APIResponsePayload";
import { ErrorHandler } from "../util/helpers/errorHandling";
import { APIController } from "./APIController";

let payload = new APIResponsePayload();

function createNewDevice(deviceData: DeviceModel): any {
    // TODO: device duplicate on controller validation
    // TODO: on device creation, send new device data to clients
    return new Promise((resolve, reject) => {
        let device: any;

        if (deviceData[0])
            deviceData = deviceData[0];


        async.waterfall([
            function getControllerInfo(done: Function) {
                Controller.find({machine_name: deviceData._controllerID}, "_id", (err, found) => {
                    console.log(found);
                    if (err || !found)
                        done("error occurred while fetching data");
                    else {
                        device = new Device({
                            "name": deviceData.name,
                            "machine_name": deviceData.machine_name,
                            "_controllerID": found[0]._id,
                            "used_pins": deviceData.used_pins
                        });
                        done();
                    }
                });
            },

            function saveDevice(done: Function) {
                console.log(device._controllerID);
                device.save(function (err, device: DeviceModel) {
                    if (err) {
                        payload.addUnformattedData({error: err});
                    }
                    payload.addUnformattedData({device: device});
                    done(err, device);
                });
            },
            function updateControllerWithNewDeviceInfo(device: DeviceModel, done: Function) {
                try {
                    Controller.find({machine_name: deviceData._controllerID}, (err, controller: ControllerModel) => {
                        if (err)
                            payload.addUnformattedData({error: err});
                        else if (!controller)
                            payload.addUnformattedData({error: "No controller with that id was found"});
                        else {
                            console.log(controller);
                            controller[0].devices.push({_id: device._id, name: device.name});
                            controller[0].save(function (err) {
                                if (err) {
                                    payload.addUnformattedData({error: err});
                                }
                            });
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

    createNewDevice(device).then((result) => {
        response.sendSuccess(result);

        payload = new APIResponsePayload();
    }).catch((err) => {
        response.sendError(err);

        payload = new APIResponsePayload();
    });
};

/**
 * GET /devices/get
 * Get all or a certain device.
 * parameters: id - optional
 *
 */
export const read = (req: Request, res: Response) => {
    const deviceID: string = req.query.id;
    const api = new APIController(res, Device);

    api.read(deviceID);
};

/**
 * GET /devices/edit
 * Get all sensors of a certain controller.
 * parameters: device id, update parameters
 *
 */
export let update = (req: Request, res: Response) => {
    const parameters: DeviceModel = req.body;
    const api = new APIController(res, Controller);

    api.update(parameters);
};

/**
 * GET /devices/delete
 * Get delete a certain device
 * parameters: device id
 *
 */
export let remove = (req: Request, res: Response) => {
    const deviceID: string = req.body;
    const api = new APIController(res, Device);

    api.remove(deviceID);
};
