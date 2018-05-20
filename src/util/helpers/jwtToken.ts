"use strict";
import jwt from "jsonwebtoken";
import {default as User} from "../../models/User";
import { DB } from "./queryHelper";


export class JwtToken {
    static validateToken(token: string): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                jwt.verify(token, process.env.APPLICATION_KEY);
            } catch (e) {
                console.error("token mismatch", e);
                resolve(false);
            }
            resolve(true);
        });
    }

    static decodeToken(token: string): any {
        try {
            return jwt.decode(token);
        } catch (err) {
            return "";
        }
    }

    static getRole(token: string) {
        return new Promise(async (resolve) => {
            const decoded = await this.decodeToken(token);
            if (decoded)
                return decoded.role;
            else
                return false;
        });
    }

    static getUid(token: string) {
        return new Promise(async (resolve) => {
            const decoded = await this.decodeToken(token);
            if (decoded)
                return decoded._id;
            else
                return false;
        });
    }

    static checkIfTokenAssigned(token: any): Promise<boolean> {
        return new Promise(async (resolve) => {
            const validToken = await this.validateToken(token);

            if (validToken) {
                const user = await DB.findOne(User,{apiKey: token});
                if (user) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } else {
                resolve(false);
            }
        });
    }

    static generateToken(signingParams: object): string {
        return jwt.sign(signingParams, process.env.APPLICATION_KEY);
    }
}