"use strict";

import {ParseRequest} from "./parseRequest";
import {Payload} from "./APIResponsePayload";

export class APIResponse {
    private res: Response;

    constructor(res: Response) {
        this.res = res;
        this.res.setHeader("Content-Type", "application/json");
    }

    sendSuccess(data: Payload) {
        if (data == undefined) {
            this.res.status(500).send({error: "result is undefined"});
        } else {
            this.res.send(ParseRequest.toString(data.data));
        }
    }

    sendError(data: Payload) {
        console.log(data.errors[0]);
        this.res.status(500).send(ParseRequest.toString(data.errors[0]));
    }
}