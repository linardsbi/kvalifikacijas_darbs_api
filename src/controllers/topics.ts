"use strict";

import async from "async";
import request from "request";

import { Response, Request, NextFunction } from "express";
import { default as Topic } from "../models/Topic";


/**
 * Handles all the routes associated with the Topic model
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


