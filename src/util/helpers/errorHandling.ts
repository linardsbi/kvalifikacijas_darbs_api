"use strict";
// TODO: log errors in database, attach logging api endpoints
export class ErrorHandler {
    static handle(err: Error): void {
        // TODO: finish this
        if (process.env.NODE_ENV !== "production") {
            console.log(err);
        } else {
            console.log("an error occurred");
        }
    }
}