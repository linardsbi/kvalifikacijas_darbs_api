"use strict";

import {NextFunction, Request, Response} from "express";
import {APIResponsePayload, Payload} from "../util/helpers/APIResponsePayload";
import {APIResponse} from "../util/helpers/APIResponse";
import {ParseRequest} from "../util/helpers/parseRequest";
import jwt from "jsonwebtoken";
import {DB, ObjectID, objectID} from "../util/helpers/queryHelper";
import {JwtToken as token} from "../util/helpers/jwtToken";
import {ControllerModel, default as Controller, default as DeviceController} from "../models/DeviceController";
import {default as Device, DeviceModel} from "../models/Device";
import User, {APIToken} from "../models/User";
import Conditional, {ConditionalInterface} from "../models/Conditional";
import {EventHandler} from "../util/helpers/eventHandling";
import {eventSubject} from "../models/EventLog";

export class APIController {
    payload = new APIResponsePayload();
    private resource: any;
    private res: Response;
    private req: Request;
    private apiResponse: APIResponse;

    constructor(request: any, response: any, resource: any) {
        this.resource = resource;
        this.req = request;
        this.res = response;
        this.apiResponse = new APIResponse(response);
    }

    update(parameters: any) {
        if (parameters && isAllowed(parameters._id)) {
            this.updateResource(parameters).then((result: Payload) => {
                this.apiResponse.sendSuccess(result);
            }, (err) => {
                this.apiResponse.sendError(err);
            });
        }
    }

    remove(itemID: ObjectID) {
        if (itemID && isAllowed(itemID)) {
            this.deleteResource(itemID).then((result: Payload) => {
                this.apiResponse.sendSuccess(result);
            }, (err) => {
                this.apiResponse.sendError(err);
            });
        }
    }

    read(itemID: ObjectID) {
        if (itemID) {
            this.getResourceData(itemID).then((result: Payload) => {
                this.apiResponse.sendSuccess(result);
            }, (err) => {
                this.apiResponse.sendError(err);
            });
        }
    }

    sendError(error: any) {
        EventHandler.error(`API error: ${error}`);

        this.apiResponse.sendError(error);
    }

    private getResourceData(itemID: any) {
        return new Promise((resolve, reject) => {
            const payload = this.payload;

            ParseRequest.getValuesFromJSONString(itemID).then((itemIDs: object) => {
                this.resource.find({_id: {$in: itemIDs}}, function (err: Error, found: any) {
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

    private deleteResource(itemID: ObjectID) {
        return new Promise((resolve, reject) => {
            this.resource.findByIdAndRemove(itemID, async (err: any) => {
                if (err) {
                    this.payload.addUnformattedData({error: err});
                    reject(this.payload.getFormattedPayload());
                }

                if (this.resource instanceof Device) {
                    const result: any = await DB.findOne(Controller, {"devices._id": itemID});
                    result.devices.remove();
                    result.save();
                } else if (this.resource instanceof Controller) {
                    const result: any = await DB.findOne(User, {"controllers._id": itemID});
                    console.log(result);
                    result.devices.remove();
                    result.save();
                }

                this.payload.addUnformattedData({success: "success"});
                resolve(this.payload.getFormattedPayload());
            });
        });
    }

    private updateResource(parameters: any) {
        return new Promise((resolve, reject) => {
            this.resource.findByIdAndUpdate(parameters._id, parameters, async (err: any) => {
                if (err) {
                    this.payload.addUnformattedData({error: err});
                    reject(this.payload.getFormattedPayload());
                }

                if (this.resource instanceof Device && parameters.name) {
                    const result: any = await DB.findOne(Controller, {"devices._id": parameters._id});
                    result.devices.name = parameters.name;
                    result.save();
                } else if (this.resource instanceof Controller) {
                    const result: any = await DB.findOne(User, {"controllers._id": parameters._id});
                    result.devices.name = parameters.name;
                    result.save();
                }

                this.payload.addUnformattedData({success: "success"});
                resolve(this.payload.getFormattedPayload());
            });
        });
    }
}

/**
 * Authentication middleware
 */
export let isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
    // TODO: auth check
    const isValid = await token.checkIfTokenAssigned(req.headers.authtoken);

    if (isValid) {
        return next();
    } else {
        const decodedToken: APIToken = token.decodeToken(req.headers.authtoken.toString());
        const subject: eventSubject = {
            _id: decodedToken._id || undefined,
            model: "User"
        };

        EventHandler.error(`invalid auth token ${req.headers.authtoken.toString()}`, subject);
        res.status(403).send({error: "Invalid auth token"});
    }
};

const isAllowed = async (itemID: any) => {
    let allowed: boolean = false;
    let uid: objectID | null;

    if (this.req.headers.authtoken) {
        const decoded = await token.decodeToken(this.req.headers.authtoken);
        if (decoded && decoded.role === "admin") {
            allowed = true;
        } else if (decoded && decoded._id) {
            allowed = await findClientResource(decoded._id, itemID);
        }

        uid = decoded._id;
    } else if (this.req.user) {
        if (this.req.user.role === "admin")
            allowed = true;
        else if (this.req.user.role === "user") {
            allowed = await findClientResource(this.req.user, itemID);
        }
    }

    if (!allowed) {
        const subject = {
            _id: uid || this.req.user._id,
            model: "User"
        };

        EventHandler.error("Unauthorised access attempt", subject);
    }

    return allowed;
};

async function findClientResource(uid: ObjectID, itemID: any): Promise<boolean> {
    let result;

    if (this.resource instanceof DeviceController) {
        result = await DB.findOne<ControllerModel>(this.resource, {_client_id: uid}, "_id");

        return result._id === itemID;
    } else if (this.resource instanceof Device) {
        const controller = await DB.findOne<ControllerModel>(Controller, {"devices._id": itemID._id}, "_client_id");

        return controller._client_id === uid;
    } else if (this.resource instanceof Conditional) {
        const conditional: any = await DB.findById<ConditionalInterface>(Conditional, itemID._id);

        if (conditional) {
            result = await DB.findById<ControllerModel>(Controller, conditional[0]._id);
            return result._client_id === uid;
        }
    }

    return false;
}