"use strict";

import async from "async";
import request from "request";

import { Response, Request, NextFunction } from "express";
import { default as Broker } from "../models/Broker";


/**
 * Handles all the routes associated with the Broker model
 */

/**
 * GET /api
 * List of API examples.
 */
export let getApi = (req: Request, res: Response) => {
  res.render("api/index", {
    title: "API Examples"
  });
};


