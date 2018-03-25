"use strict";

import { ParseRequest } from "./parseRequest";
import { Payload } from "./APIResponsePayload";

export class APIResponse {
  private res: Response;
  constructor(res: Response) {
    this.res = res;
  }
  sendSuccess(data: Payload) {
    this.res.setHeader("Content-Type", "application/json");

    if (data === undefined) {
      this.res.status(500).send({error: "result is undefined"});
    } else {
      this.res.send(ParseRequest.toString(data.data));
    }
  }

  sendError(data: Payload) {
    this.res.status(500).send(data.errors);
  }
}