"use strict";

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
        console.log(conditional.run);
        const newConditional: any = new Conditional({
            "name": conditional.name,
            "listenSubject": conditional.listenSubject,
            "triggerOn": conditional.triggerOn,
            "run": conditional.run
        });

        newConditional.save((err: any, result: any) => {
            if (err)
                reject(err);
            else
                resolve(result);
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

    try {
        const result = await createNewConditional(conditional);

        response.sendSuccess(result);
        payload = new APIResponsePayload();
    } catch (e) {
        payload.addUnformattedData({error: e.message});
        response.sendError(payload.getFormattedPayload());

        payload = new APIResponsePayload();
    }
};

/**
 * GET /conditionals/get
 * Get all or a certain conditional.
 * parameters: id - optional
 *
 */
export const read = (req: Request, res: Response) => {
    const conditionalID: string = req.query.id;
    const api = new APIController(req, res, Conditional);

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
    const api = new APIController(req, res, Conditional);

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
    const api = new APIController(req, res, Conditional);

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

