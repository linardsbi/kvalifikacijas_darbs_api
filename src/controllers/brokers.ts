"use strict";

import async from "async";

import {Request, Response} from "express";
import {BrokerInterface as BrokerModel, default as Broker} from "../models/Broker";
import {APIResponse} from "../util/helpers/APIResponse";
import {ParseRequest} from "../util/helpers/parseRequest";
import {APIResponsePayload, Payload} from "../util/helpers/APIResponsePayload";
import {ErrorHandler} from "eventHandling.ts";
import {default as PublishedData, PublishedDataModel} from "../models/PublishedData";
import crypto from "crypto";
import {ControllerModel, default as Controller} from "../models/DeviceController";
import {APIController} from "./APIController";
import {default as Device, DeviceModel} from "../models/Device";
import {ServerResponse} from "http";

let payload = new APIResponsePayload();

/**
 * Handles all the routes associated with the Device model
 */

/**
 * POST /brokers/create
 * Create a new broker.
 * @param {e.Request} req
 * @param {e.Response} res
 */
export const create = (req: Request, res: any) => {
    const broker: BrokerModel = req.body;
    const response = new APIResponse(res);

    async.waterfall([
        function createBroker(brokerData: BrokerModel, done: Function) {
            const broker = new Broker({
                "broker.static_ip": brokerData.static_ip
            });

            try {
                broker.save(function (err, saved) {
                    if (err) {
                        payload.addUnformattedData({error: err});
                        done(err);
                    } else {
                        payload.addUnformattedData({broker: saved});
                        done();
                    }
                });
            } catch (e) {
                payload.addUnformattedData({error: e});
                done(e);
            }
        }
    ], (result: any) => {
        result = payload.getFormattedPayload();

        if (!result.errors[0]) response.sendSuccess(result);
        else response.sendError(result);
    });

    payload = new APIResponsePayload();
};

/**
 * GET /brokers/get
 * Get all or a certain broker.
 * parameters: id - optional
 *
 */
export const read = (req: Request, res: Response) => {
    const brokerID: string = req.query.id;
    const api = new APIController(req, res, Broker);

    api.read(brokerID);
};

/**
 * PATCH /brokers/edit
 * Update a certain broker.
 * parameters: broker id, update parameters
 *
 */
export let update = (req: Request, res: Response) => {
    const parameters: BrokerModel = req.body;
    const api = new APIController(req, res, Broker);

    api.update(parameters);
};

/**
 * DELETE /brokers/delete
 * delete a certain broker
 * parameters: broker id
 *
 */
export let remove = (req: Request, res: Response) => {
    const brokerID: string = req.body;
    const api = new APIController(req, res, Broker);

    api.remove(brokerID);
};