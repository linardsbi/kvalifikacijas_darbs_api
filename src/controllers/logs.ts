"use strict";

import {Request, Response} from "express";
import {default as PublishedData, PublishedDataModel} from "../models/PublishedData";
import {APIResponsePayload, Payload} from "../util/helpers/APIResponsePayload";
import {ErrorHandler} from "../util/helpers/errorHandling";
import {APIResponse} from "../util/helpers/APIResponse";
import {DB, parseQuery} from "../util/helpers/queryHelper";
import {JwtToken} from "../util/helpers/jwtToken";
import User from "../models/User";
import Device from "../models/Device";

let payload = new APIResponsePayload();

/**
 * Handles all the routes associated with the PublishedData models
 */
export function savePostData(data: PublishedDataModel) {
    return new Promise((resolve, reject) => {
        const publishedData = new PublishedData({
            "device": data.device,
            "payload": data.payload
        });

        try {
            publishedData.save((err) => {
                if (err) {
                    ErrorHandler.handle(err);
                    payload.addUnformattedData({error: err});
                    reject(payload.getFormattedPayload());
                } else {
                    payload.addUnformattedData({success: "success"});
                    resolve(payload.getFormattedPayload());
                }
            });
        } catch (e) {
            payload.addUnformattedData({error: e});
            reject(payload.getFormattedPayload());
        }

        payload = new APIResponsePayload();
    });
}

/**
 * POST /data/post
 * Submit data.
 * parameters: controllerID, payload
 *
 */
export const postData = (req: Request, res: Response) => {
    // TODO: create a nice flow of error handling ops, minimize async ops
    const data: PublishedDataModel = req.body;
    const response = new APIResponse(res);

    savePostData(data).then((result: Payload) => {
        response.sendSuccess(result);
    }, (err) => {
        response.sendError(err);
    });
};

/**
 * GET /data/get
 * Query for data.
 * parameters: query
 * query example :
 *  "query": {
 *      // in the same object - OR
 *      // different objects - AND
 *      "select": [{
 *          // date is prefix for schema field name
 *          // two dates
 *          "date$between": ["NOW","12/12/2017"],
 *          // one date
 *          "date$lt": "01/07/2017",
 *          "date$equals": "02/07/2017"
 *      }],
 *      "fields": ["_id","name"],
 *      "limit": "100"
 *  }
 *
 */
// const test = {"query": {"select": [{"createdAt$lt": "NOW", "name": "testname"}]}};
function getUser(query: any) {
    return new Promise((resolve) => {
        query.exec((err: any, result: any) => {
            if (result)
                resolve(result);
            else if (err)
                resolve(err);
            else resolve(false);
        });
    });
}

export const getData = async (req: Request, res: any) => {
    // TODO: create a nice flow of error handling ops, minimize async ops
    const data: string = req.query.query;
    const response = new APIResponse(res);
    const decoded = JwtToken.decodeToken(req.headers.authtoken);
    const ids: any = [];

    try {
        const result = await parseQuery(data);
        const user: any = User.findOne({email: decoded.username});
        user.populate("controllers._id");

        const userData: any = await getUser(user);

        if (userData && userData.controllers) {
            for (const controller of userData.controllers) {
                for (const device of controller._id.devices) {
                    ids.push(device._id);
                }
            }
        }

        if (result.limit)
            result.limit = parseInt(result.limit);

        if (result.select["device._id"]) {
            if (!ids.includes(result.select["device._id"]) && decoded.role !== "admin") {
                payload.addUnformattedData({error: "Insufficient permission"});
                response.sendError(payload.getFormattedPayload());
                return;
            }
        } else {
            result.select["device._id"] = {$in: ids};
        }

        const queryData = await DB.find(PublishedData, result.select, result.fields, result.limit);
        console.log("query:", result);

        payload.addUnformattedData(queryData);

        const responseData = payload.getFormattedPayload();

        response.sendSuccess(responseData);
    } catch (e) {
        if (e instanceof Error) {
            payload.addUnformattedData({error: e.message});
        }
        response.sendError(payload.getFormattedPayload());
    }
};



