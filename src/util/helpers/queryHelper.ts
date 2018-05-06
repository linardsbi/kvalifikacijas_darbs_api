"use strict";

import {Model, MongooseDocument} from "mongoose";
import {default as User} from "../../models/User";

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

    static findOne(model: Model<any>, query: object): Promise<MongooseDocument> {
        return new Promise((resolve, reject) => {
            model.findOne(query, (err, found) => {
                if (err)
                    reject(err);
                else if (!found)
                    reject(false);
                else
                    resolve(found);
            });
        });
    }

    static find(model: Model<any>, query: object): Promise<MongooseDocument[]> {
        return new Promise((resolve, reject) => {
            model.find(query, (err, found) => {
                if (err)
                    reject(err);
                else if (!found)
                    reject(false);
                else
                    resolve(found);
            });
        });
    }
}
