"use strict";

import async from "async";
import request from "request";

import { Response, Request, NextFunction } from "express";
import { default as BrokerLog } from "../models/BrokerLog";
import { default as PublishedData } from "../models/PublishedData";


/**
 * Handles all the routes associated with the BrokerLog and PublishedData models
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


