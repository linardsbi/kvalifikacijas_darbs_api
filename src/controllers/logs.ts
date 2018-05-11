"use strict";

import {Request, Response} from "express";
import {default as PublishedData, PublishedDataModel} from "../models/PublishedData";
import {APIResponsePayload, Payload} from "../util/helpers/APIResponsePayload";
import {ErrorHandler} from "../util/helpers/errorHandling";
import {APIResponse} from "../util/helpers/APIResponse";
import {DB, parseQuery} from "../util/helpers/queryHelper";

let payload = new APIResponsePayload();

/**
 * Handles all the routes associated with the PublishedData models
 */
export function savePostData(data: PublishedDataModel) {
    return new Promise((resolve, reject) => {
        const publishedData = new PublishedData({
            "_deviceID": data._deviceID,
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

export const getData = async (req: Request, res: any) => {
    // TODO: create a nice flow of error handling ops, minimize async ops
    const data: string = req.query.query;
    const response = new APIResponse(res);

    try {
        const result = await parseQuery(data);
        const queryData = await DB.find(PublishedData, result.select, result.fields);

        payload.addUnformattedData(queryData);

        const responseData = payload.getFormattedPayload();
        console.log(responseData);

        response.sendSuccess(responseData);
    } catch (e) {
        if (e instanceof Error) {
            payload.addUnformattedData({error: e.message});
        }
        response.sendError(payload.getFormattedPayload());
    }
};



