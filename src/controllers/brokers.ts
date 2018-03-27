"use strict";

import async from "async";
import request from "request";

import { Response, Request, NextFunction } from "express";
import { default as Broker, BrokerInterface as BrokerModel } from "../models/Broker";
import {APIResponse} from "../util/helpers/APIResponse";
import {ParseRequest} from "../util/helpers/parseRequest";
import {APIResponsePayload, Payload} from "../util/helpers/APIResponsePayload";
import { ErrorHandler } from "../util/helpers/errorHandling";
import crypto from "crypto";

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
export const create = (req: Request, res: Response) => {
    const broker: BrokerModel = req.body;
    const response = new APIResponse(res);

    async.waterfall([
        function generateSecret(done: Function){
            crypto.randomBytes(16, function (err: Error, buffer: any) {
                broker.secret = buffer.toString("hex");
                if (err) payload.addUnformattedData({ error: err });
                done(err, broker);
            });
        },
        function createBroker(brokerData: BrokerModel, done: Function) {
            const broker = new Broker();

            if (brokerData.static_ip) {
                broker.static_ip = brokerData.static_ip;
                broker.secret = brokerData.secret;
            } else {
                payload.addUnformattedData({error: "Required parameter static_ip is missing"});
            }
            try {
                const result = broker.save(function (err, saved) {
                    if (err) {
                        payload.addUnformattedData({ error: err });
                        done(err);
                    } else {
                        payload.addUnformattedData({ broker: saved });
                        done();
                    }
                });
            } catch (e) {
                payload.addUnformattedData({ error: e });
                done(e);
            }
        }
    ], (result) => {
        result = payload.getFormattedPayload();
        
        if (!result.errors[0]) response.sendSuccess(result);
        else response.sendError(result);
    });

    payload = new APIResponsePayload();
};

function getBroker(brokerID?: string): any {
    return new Promise((resolve, reject) => {
        let broker: any;

        if (brokerID) {
            ParseRequest.getValuesFromJSONString(brokerID).then( (brokerIDs: object) => {
                broker = Broker.find({_id: { $in: brokerIDs }}, function (err, found) {
                    if (err) {
                        payload.addUnformattedData({ error: "Error occurred while trying to find a broker"});
                    }
                    payload.addUnformattedData(found);
                    resolve(payload.getFormattedPayload());
                });
            }, (err) => {
                payload.addUnformattedData(err);
                reject(payload.getFormattedPayload());
            });
        } else {
            broker = Broker.find({}, function (err, found) {
                if (err) {
                    payload.addUnformattedData({ error: "Error occurred while trying to find brokers" });
                }
                payload.addUnformattedData(found);
                resolve(payload.getFormattedPayload());
            });
        }
    });
}

/**
 * GET /brokers/get
 * Get all or a certain broker.
 * parameters: id - optional
 *
 */
export const read = (req: Request, res: Response) => {
    // TODO: create a nice flow of error handling ops, minimize async ops
    const brokerID: string = req.query.id;
    const response = new APIResponse(res);

    getBroker(brokerID).then( (result: Payload) => {
        response.sendSuccess(result);
        // Temporary solution
        payload = new APIResponsePayload();
    }, (err) => {
        response.sendError(err);
        // Temporary solution
        payload = new APIResponsePayload();
    });
};

