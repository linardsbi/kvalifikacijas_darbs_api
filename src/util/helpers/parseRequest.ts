"use strict";

import { ErrorHandler } from "./errorHandling";


export class ParseRequest {
    /**
     * Convert JSON string to object
     * @param {string} requestBody
     * @returns {object}
     */
    static toObject(requestBody: string): object {
        try {
            return JSON.parse(requestBody);
        } catch (e) {
            ErrorHandler.handle(e);
            return {error: "Error occurred while parsing string"};
        }

    }

    /**
     * Convert JSON object to string
     * @param {object} requestBody
     * @returns {string}
     */
    static toString(requestBody: object): string {
        try {
            return JSON.stringify(requestBody);
        } catch (e) {
            ErrorHandler.handle(e);
            return "";
        }
    }
}