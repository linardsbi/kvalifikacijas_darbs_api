"use strict";

import { ErrorHandler } from "./errorHandling";
import {type} from "os";

interface ErrorObject {
    error: string;
}

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
            return "invalid json object";
        }
    }

    /**
     * Check if string can be converted to JSON
     * @param {string} string
     * @returns {boolean}
     */
    static isJSON(string: string): boolean {
        try {
            return !!(JSON.parse(string));
        } catch (e) {
            return false;
        }
    }

    static convertJSONArrayToArray(jsonArray: object[] | object): object[] | object {
        const newArray: any = [];

        try {
            for (const item of jsonArray) {
                for (const objectKey in item) {
                    let value: string;

                    if (item.hasOwnProperty(objectKey)) {
                        value = item[objectKey];
                    }

                    newArray.push(value);
                }
            }
        } catch (e) {
            return {error: "array is not a valid json object"};
        }

        return newArray;
    }

    static getValuesFromJSONString(jsonString: string): Promise<object> {
        return new Promise((resolve, reject) => {
            const jsonObject: any = ParseRequest.toObject(jsonString);
            let convertedString: any = {};

            if (!jsonObject.error) {
                convertedString = ParseRequest.convertJSONArrayToArray(jsonObject);
                if (convertedString.error) {
                    reject(convertedString);
                } else {
                    resolve(convertedString);
                }
            } else {
                reject(jsonObject);
            }
        });
    }
}