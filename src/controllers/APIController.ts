"use strict";

import {NextFunction, Request, Response} from "express";
import {APIResponsePayload, Payload} from "../util/helpers/APIResponsePayload";
import {APIResponse} from "../util/helpers/APIResponse";
import {ParseRequest} from "../util/helpers/parseRequest";

export class APIController {
    payload = new APIResponsePayload();
    private resource: any;
    private res: Response;
    private apiResponse: APIResponse;

    constructor(response: Response, resource: any) {
        this.resource = resource;
        this.res = response;
        this.apiResponse = new APIResponse(response);
    }

    update(parameters: any) {
        if (parameters) {
            this.updateResource(parameters).then((result: Payload) => {
                this.apiResponse.sendSuccess(result);
            }, (err) => {
                this.apiResponse.sendError(err);
            });
        }
    }

    remove(itemID: string) {
        if (itemID) {
            this.deleteResource(itemID).then((result: Payload) => {
                this.apiResponse.sendSuccess(result);
            }, (err) => {
                this.apiResponse.sendError(err);
            });
        }
    }

    read(itemID: string) {
        if (itemID) {
            this.getResourceData(itemID).then((result: Payload) => {
                this.apiResponse.sendSuccess(result);
            }, (err) => {
                this.apiResponse.sendError(err);
            });
        }
    }

    private getResourceData(itemID: string) {
        return new Promise((resolve, reject) => {
            const payload = this.payload;

            ParseRequest.getValuesFromJSONString(itemID).then((itemIDs: object) => {
                this.resource.find({_id: {$in: itemIDs}}, function (err, found: any) {
                    if (err) {
                        payload.addUnformattedData({error: err});

                        reject(payload.getFormattedPayload());
                    }

                    payload.addUnformattedData(found);
                    resolve(payload.getFormattedPayload());
                });
            });
        });
    }

    private deleteResource(itemID: string) {
        return new Promise((resolve, reject) => {
            this.resource.findByIdAndRemove(itemID, (err: any) => {
                if (err) {
                    this.payload.addUnformattedData({error: err});
                    reject(this.payload.getFormattedPayload());
                }

                this.payload.addUnformattedData({success: "success"});
                resolve(this.payload.getFormattedPayload());
            });
        });
    }

    private updateResource(parameters: any) {
        return new Promise((resolve, reject) => {
            this.resource.findByIdAndUpdate(parameters._id, parameters, (err: any) => {
                if (err) {
                    this.payload.addUnformattedData({error: err});
                    reject(this.payload.getFormattedPayload());
                }

                this.payload.addUnformattedData({success: "success"});
                resolve(this.payload.getFormattedPayload());
            });
        });
    }
}

/**
 * Handles all the routes associated with the DeviceController model
 */
export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    // TODO: auth check
    next();
};

