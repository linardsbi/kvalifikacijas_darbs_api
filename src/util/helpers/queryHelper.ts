"use strict";
import { Model, MongooseDocument } from "mongoose";
import { ParseRequest as parse } from "./parseRequest";
import mongoose from "mongoose";

export interface ObjectID extends mongoose.Schema.Types.ObjectId {
    _id: mongoose.Schema.Types.ObjectId;
}

export class DB {
    static findById<T>(model: Model<any>, id: mongoose.Schema.Types.ObjectId): Promise<T> {
        return new Promise((resolve, reject) => {
            model.findById(id, function (err, found) {
                if (err)
                    reject(err);
                else if (!found)
                    reject(false);
                else
                    resolve(found);
            });
        });
    }

    static findOne<T>(model: Model<any>, query: object, fields?: string, limit?: number): Promise<T> {
        return new Promise((resolve, reject) => {
            const modelQuery = model.findOne(query);

            if (fields)
                modelQuery.select(fields);

            if (limit)
                modelQuery.limit(limit);

            modelQuery.exec( (err, found) => {
                if (err)
                    throw new Error(err);
                else if (!found)
                    reject(false);
                else
                    resolve(found);
            });
        });
    }

    static find<T>(model: Model<any>, query: object, fields?: string, limit?: number): Promise<T[]> {
        return new Promise((resolve, reject) => {
            const modelQuery = model.find(query);

            if (fields)
                modelQuery.select(fields);

            if (limit)
                modelQuery.limit(limit);

            modelQuery.sort([["createdAt", "ascending"]]);

            modelQuery.exec( (err, found) => {
                if (err)
                    throw new Error(err);
                else if (!found)
                    reject(false);
                else
                    resolve(found);
            });
        });
    }
}

export type formattedQueryType = {
    select: any,
    fields: string,
    limit: number
};

export async function parseQuery(query: string): Promise<formattedQueryType> {
    const queryObject: any = parse.toObject(query);
    const formattedQuery: formattedQueryType = {
        select: {},
        fields: "",
        limit: 0
    };

    if (!queryObject.error && queryObject.query) {
        let finished: boolean = false;
        let element: any = queryObject.query;
        let arrayIndex: number = 0;

        while (!finished) {
            if (typeof element === "object") {
                if (element.select) {
                    element.select.forEach((array: any) => {
                        Object.keys(array).forEach((key) => {
                            const field = key.split("$")[0];
                            const operation = key.split("$")[1];
                            const convertText = (text: string) => {
                                const date = new Date();

                                if (text.toLowerCase() === "now")
                                    return date;
                                else if (text.split(" ")[1]) {
                                    const splitText = text.split(" ");
                                    let unixDate = 0;

                                    ["min", "h", "d", "w", "mo"].forEach((item: string) => {
                                        const startPos = splitText[0].indexOf(item);
                                        if (startPos !== -1) {
                                            const dateNumber: number = parseInt(splitText[0].substring(0, startPos));
                                            const separator: string = splitText[0].substring(startPos);

                                            switch (separator) {
                                                case "min":
                                                    unixDate = date.setMinutes(date.getMinutes() - dateNumber);
                                                    break;
                                                case "h":
                                                    unixDate = date.setHours(date.getHours() - dateNumber);
                                                    break;
                                                case "d":
                                                    unixDate = date.setDate(date.getDate() - dateNumber);
                                                    break;
                                                case "w":
                                                    unixDate = date.setDate(date.getDate() + (-dateNumber * 7));
                                                    break;
                                                case "mo":
                                                    unixDate = date.setMonth(date.getMonth() - dateNumber);
                                            }
                                        }
                                    });

                                    if (unixDate > 0) {
                                        return date.toISOString();
                                    } else {
                                        throw new Error(`Invalid date identifier ${splitText[0]}`);
                                    }
                                }

                                return text;
                            };

                            if (array[key] instanceof Array) {
                                array[key] = array[key].map((item: any) => {
                                    return convertText(item);
                                });
                            } else
                                array[key] = convertText(array[key]);

                            switch (operation) {
                                case "equals":
                                    formattedQuery.select[field] = array[key];
                                    break;
                                case "lt":
                                    formattedQuery.select[field] = {$lt: array[key]};
                                    break;
                                case "gt":
                                    formattedQuery.select[field] = {$gt: array[key]};
                                    break;
                                case "between":
                                    formattedQuery.select[field] = {$lt: array[key][0], $gt: array[key][1]};
                                    break;
                                case "in":
                                    formattedQuery.select[field] = {$in: array[key]};
                                    break;
                            }
                        });
                    });
                }
            } else if (element instanceof Array) {
                element = element[arrayIndex];
                arrayIndex++;
            }

            if (element.fields) {
                formattedQuery.fields = element.fields;
            } else if (element.limit) {
                formattedQuery.limit = parseInt(element.limit);
            }

            if (element[arrayIndex]) {
                element = queryObject.query[arrayIndex];
            } else {
                finished = true;
            }
        }
    } else {
        throw new Error(queryObject.error || "Invalid query string");
    }

    return formattedQuery;
}
