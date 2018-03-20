"use strict";

import async from "async";
import request from "request";

import { Response, Request, NextFunction } from "express";
import {default as Controller, Controller as ControllerInterface } from "../models/DeviceController";
import {default as Topic } from "../models/Topic";
import {default as Sensor } from "../models/Device";
import {default as PublishedData } from "../models/PublishedData";


function returnResponse(res: Response, controller: any, err: Error) {
    if (err) {
        handleErrors(err);
        res.status(500).send("Error occurred when fetching controller");
    }

    res.send(controller);
}

/**
 * Handles all the routes associated with the DeviceController model
 */

export let isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    // TODO: auth check
    next();
};

/**
 * POST /controllers/create
 * Create a new controller.
 * parameters: name, machine_name
 *
 */
export let createController = (req: Request, res: Response) => {
    const controller: any = new Controller();
    controller.name = req.body.name;
    controller.machine_name = req.body.name;

    controller.save(function (err, controller) {
        if (err) {
            handleErrors(err);
            res.status(500).send("Error occurred when saving controller");
        }

        res.send("OK");
    });
};

/**
 * GET /controllers/get
 * Get all or a certain controller.
 * parameters: id - optional
 *
 */
export let getController = (req: Request, res: Response) => {
    let controller: object;
    const controllerID = req.body.id;
    if (controllerID) {
        controller = Controller.find(function (err, found) {
            returnResponse(res, found, err);
        });
    } else {
         controller = Controller.findById(controllerID, function (err, found) {
             returnResponse(res, found, err);
        });
    }
};

/**
 * GET /controllers/get/topics
 * Get all topics of a certain controller.
 * parameters: controller id
 *
 */
export let getControllerTopics = (req: Request, res: Response) => {
    let controller: object;
    let topics: object;
    const controllerID = req.body.id;
    if (controllerID) {
        controller = Controller.findOne({id: req.body.id}, function (err) {
            if (err) res.send("error");
        });

        topics = Topic.find({_controllerID: controller.id}, function (err, found) {
            if (err) res.send("error");
            returnResponse(res, found, err);
        });
    }
};

/**
 * GET /controllers/get/sensors
 * Get all sensors of a certain controller.
 * parameters: controller id
 *
 */
export let getControllerSensors = (req: Request, res: Response) => {
    let controller: object;
    let sensors: object;
    const controllerID = req.body.id;
    if (controllerID) {
        controller = Controller.findOne({id: req.body.id}, function (err) {
            if (err) res.send("error");
        });

        sensors = Sensor.find({_controllerID: controller.id}, function (err, found) {
            if (err) res.send("error");
            returnResponse(res, found, err);
        });
    }
};

/**
 * GET /controllers/get/topics
 * Get data that came from devices connected to a specific controller
 * parameters:
 *             extra parameters {
 *                  	datetime: String,
 *                      controllerIDs: ObjectID,
 *                      clientIDs: ObjectID,
 *                      topicName: String,
 *             }
 */
export let getControllerData = (req: Request, res: Response) => {
    // TODO: handle extra parameters
    let controller: object;
    let data: object;
    const controllerID = req.body.id;
    if (controllerID) {
        controller = Controller.findOne({id: req.body.id}, function (err) {
            if (err) res.send("error");
        });

        data = PublishedData.find({_controllerID: controller.id}, function (err, found) {
            if (err) res.send("error");
            returnResponse(res, found, err);
        });
    }
};

/**
 * GET /controllers/edit
 * Get all sensors of a certain controller.
 * parameters: controller id, update parameters
 *
 */
export let editController = (req: Request, res: Response) => {
    // TODO: request body to update parameters
    let controller: any;
    const update: object = req.body;
    const controllerID = req.body.id;
    if (controllerID) {
        controller = Controller.findByIdAndUpdate({id: req.body.id}, update, function (err) {
            if (err) res.send("error");
        });
    }
};

/**
 * GET /controllers/delete
 * Get delete a certain controller
 * parameters: controller id
 *
 */
export let deleteController = (req: Request, res: Response) => {
    let controller: any;
    const controllerID = req.body.id;
    if (controllerID) {
        controller = Controller.findByIdAndRemove({id: req.body.id}, function (err) {
            if (err) res.send("error");
        });
    }
};