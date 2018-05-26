import {default as Log, eventSubject} from "../../models/EventLog";

"use strict";

export class EventHandler {
    static error(error: any, subject?: eventSubject): void {
        if (process.env.NODE_ENV !== "production")
            console.log(error);
        else
            console.log("an error occurred");


        this.createNewLog("error", error, subject);
    }

    static log(event: string, message: string, subject?: eventSubject): void {
        this.createNewLog(event, message, subject);
    }

    private static createNewLog(event: string, event_body: any, event_subject?: eventSubject | undefined): void {
        const log = new Log({
            event: event,
            event_subject: event_subject,
            event_body: event_body
        });

        log.save((err: any) => {
            if (err)
                console.log("could not save log:", err);
        });
    }
}