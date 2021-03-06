"use strict";

import { EventHandler } from "./eventHandling";
import {type} from "os";

interface ErrorObject {
    error: string;
}

export class ParseRequest {
    static toObject(requestBody: string): object {
        try {
            return JSON.parse(requestBody);
        } catch (e) {
            return {error: "Error occurred while parsing string"};
        }
    }

    static toString(requestBody: object): string {
        try {
            return JSON.stringify(requestBody);
        } catch (e) {
            return "invalid json object";
        }
    }

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
            return {error: e.message};
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