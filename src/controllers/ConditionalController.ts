"use strict";

import async from "async";

import {Request, Response} from "express";
import {ControllerModel, default as Controller} from "../models/DeviceController";
import {ConditionalInterface, default as Conditional} from "../models/Conditional";
import {APIResponse} from "../util/helpers/APIResponse";
import {APIResponsePayload} from "../util/helpers/APIResponsePayload";
import {APIController} from "./APIController";
import {DB} from "../util/helpers/queryHelper";
import {default as Device} from "../models/Device";

let payload = new APIResponsePayload();

function createNewConditional(conditional: ConditionalInterface): any {
    return new Promise((resolve, reject) => {
        async.waterfall([
            async function getControllerID(next: Function) {
                try {
                    const result: any = await DB.findOne(Controller, {machine_name: conditional.listenSubject.subjectControllerID}, "_id");
                    if (result)
                        next(undefined, result._id);
                    else
                        next();
                } catch (e) {
                    next(e.message);
                }
            },
            function formatDataForDatabase(controllerID: ConditionalInterface, next: Function) {
                // TODO: formatting
                if (controllerID)
                    next(undefined, controllerID);
                else
                    next();
            },
            async function insertConditionalIntoDatabase(controllerID: any, done: Function) {
                if (controllerID) {
                    Conditional.save((err: any, result: ConditionalInterface) => {
                        if (err)
                            done(err);
                        else if (!result)
                            done();
                        else
                            done(undefined, result);
                    });
                } else
                    done();
            }
        ], (err, result) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                payload.addUnformattedData(result);
                resolve(result);
            }
        });
    });
}

/**
 * Handles all the routes associated with the conditional model
 */
/**
 * POST /conditionals/create
 * Create a new conditional.
 * required parameters -
 * @param {e.Request} req
 * @param {e.Response} res
 */
export const create = async (req: Request, res: any) => {
    const conditional: ConditionalInterface = req.body;
    const response = new APIResponse(res);

    const result = await createNewConditional(conditional);

    result.catch((err: any) => {
        payload.addUnformattedData({error: err});
        response.sendError(payload.getFormattedPayload());

        payload = new APIResponsePayload();
    });

    result.then((result: any) => {
        payload.addUnformattedData({result: result});
        response.sendError(payload.getFormattedPayload());

        response.sendSuccess(result);
        payload = new APIResponsePayload();
    });
};

/**
 * GET /conditionals/get
 * Get all or a certain conditional.
 * parameters: id - optional
 *
 */
export const read = (req: Request, res: Response) => {
    const conditionalID: string = req.query.id;
    const api = new APIController(res, Conditional);

    api.read(conditionalID);
};

/**
 * PATCH /conditionals/edit
 * Edit a conditional
 * parameters: controller id, update parameters
 *
 */
export let update = (req: Request, res: Response) => {
    const parameters: ConditionalInterface = req.body;
    const api = new APIController(res, Conditional);

    api.update(parameters);
};

/**
 * GET /conditionals/delete
 * Get delete a certain conditional
 * parameters: controller id
 *
 */
export let remove = (req: Request, res: Response) => {
    const conditionalID: string = req.body;
    const api = new APIController(res, Conditional);

    api.remove(conditionalID);
};

export const getConditionalView = async (req: Request, res: Response) => {
    const controllers = await DB.find(Controller, {_client_id: req.user.id});
    const controllerIDs: string[] = [];

    controllers.forEach((controller: ControllerModel) => {
        if (controller._id)
            controllerIDs.push(controller._id);
    });

    const devices = await Device.find({_controllerID: {$in: controllerIDs}}).populate("_controllerID");
    const conditionals = await DB.find(Conditional, {"listenSubject.subjectControllerID": {$in: controllerIDs}});

    res.render("account/conditionals", {
        title: "Conditionals",
        conditionals: conditionals,
        controllers: controllers,
        devices: devices
    });
};

