"use strict";

import {Model, MongooseDocument} from "mongoose";
import {ParseRequest as parse} from "./parseRequest";

export class DB {

    static findById(model: Model<any>, id: string): Promise<MongooseDocument> {
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

    static findOne(model: Model<any>, query: object, fields?: string): Promise<MongooseDocument> {
        return new Promise((resolve, reject) => {
            if (fields) {
                model.findOne(query, fields, (err, found) => {
                    if (err)
                        reject(err);
                    else if (!found)
                        reject(false);
                    else
                        resolve(found);
                });
            } else {
                model.findOne(query, (err, found) => {
                    if (err)
                        reject(err);
                    else if (!found)
                        reject(false);
                    else
                        resolve(found);
                });
            }

        });
    }

    static find(model: Model<any>, query: object, fields?: string): Promise<MongooseDocument[]> {
        return new Promise((resolve, reject) => {
            if (fields) {
                model.find(query, fields,(err, found) => {
                    if (err)
                        reject(err);
                    else if (!found)
                        reject(false);
                    else
                        resolve(found);
                });
            } else {
                model.find(query, (err, found) => {
                    if (err)
                        reject(err);
                    else if (!found)
                        reject(false);
                    else
                        resolve(found);
                });
            }
        });
    }
}

type formattedQueryType = {
    select: any,
    fields: string,
    limit: number
};

export async function parseQuery(query: string): Promise<any> {
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

                            if (array[key] instanceof Array) {
                                array[key].map((item: any) => {
                                    if (item === "NOW")
                                        return new Date();
                                    else return item;
                                });
                            } else if (array[key] === "NOW")
                                array[key] = new Date();

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
                                    formattedQuery.select[field] = {$gt: array[key][0], $lt: array[key][1]};
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
            } else if (element.fields) {
                element.fields.forEach((el: string, index: number) => {
                    formattedQuery.fields += el;
                    if (element.fields[index + 1]) {
                        formattedQuery.fields += ", ";
                    }
                });
            } else if (element.limit) {
                formattedQuery.limit = element.limit;
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
