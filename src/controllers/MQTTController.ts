"use strict";

import async from "async";
import request from "request";
import passport from "passport";

import { Response, Request, NextFunction } from "express";
import { default as Controller, ControllerModel } from "../models/DeviceController";
import { default as User, UserModel } from "../models/User";
import { APIResponsePayload, Payload } from "../util/helpers/APIResponsePayload";
import { createNewController } from "../controllers/deviceControllers";
// import { default as Controller, ControllerModel } from "../models/DeviceController";

const payload = new APIResponsePayload();

function handleSys(packet) {
  if (packet.topic.search("/\/new\/clients/")) {
  }
}
function handleFirstConnection(packet) {
  const clientID = packet.topic.split("/")[0];
  const username = packet.payload.toString();
  console.log(clientID, username);
  addController(clientID, username).then((result) => {
    console.log("result", result);
  }, (err) => {
    console.log("error", err);
  });
}

export function handleClientPublish(packet) {
  console.log("packet info", packet.topic.indexOf("firstConnection"), packet.topic.search("/\$SYS\//"));
  if (packet.topic.search("/\$SYS\//") !== -1) {
    handleSys(packet);
  } else if (packet.topic.indexOf("firstConnection")) {
    handleFirstConnection(packet);
  }
}

export function addController(clientID: string, username: string) {
  return new Promise((resolve, reject) => {
    async.waterfall([
      function checkIfControllerBelongsToUser(cb: Function) {
        User.findOne({"controllers.machine_name": clientID}, "_id", (err, found: UserModel) => {
          if (err) cb(err, true);
          if (!found)
            cb(null, true);
          else
            cb(null, "exists");
        });
      },
      function addToUserControllers(user: any, cb: Function) {
        // If a user is authenticated and doesn't have the particular controller, create a new one
        if (user && user !== "exists") {
          User.findOne({email: username}, (err, user) => {
            if (err) cb(null);
            else {
              const controller = {
                name: clientID.split("_")[0],
                machine_name: clientID,
                _client_id: user._id
              };
              cb(null, controller);
            }
          });
        } else if (user === "exists")
            cb(null, user);
          else
            cb(null);
      }
    ], (err, result) => {
      if (err) {
        payload.addUnformattedData(err);
        reject(payload.getFormattedPayload());
      } else if (result === "exists") {
        resolve(payload.getFormattedPayload());
      } else if (result) {
        createNewController(result).then(() => {
          resolve(payload.getFormattedPayload());
        }, () => {
          reject(payload.getFormattedPayload());
        });
      } else {
        reject(payload.getFormattedPayload());
      }
    });
  });
}

export function authenticate(clientID: string, username: string, password: string) {
  return new Promise((resolve, reject) => {
    async.waterfall([
      function checkCredentials(cb: Function) {
        User.findOne({ email: username.toLowerCase() }, (err, user: UserModel) => {
          if (err) cb({error: err}, null);
          if (!user)
            cb({error: "invalid username or password"}, null);
          else {
            user.comparePassword(password, (err: Error, isMatch: boolean) => {
              if (err) cb({error: err}, null);

              if (isMatch)
                cb(null, user);
              else
                cb({error: "invalid username or password"}, null);
            });
          }
        });
      }
    ], (err) => {
      if (err) {
        payload.addUnformattedData(err);
        reject(payload.getFormattedPayload());
      } else resolve(payload.getFormattedPayload());
    });
  });
}





