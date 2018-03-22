import express from "express";
import compression from "compression"; // compresses requests
import session from "express-session";
import bodyParser from "body-parser";
import lusca from "lusca";
import dotenv from "dotenv";
import mongo from "connect-mongo";
import flash from "express-flash";
import path from "path";
import mongoose from "mongoose";
import passport from "passport";
import expressValidator from "express-validator";
import bluebird from "bluebird";
import {MONGODB_URI, SESSION_SECRET} from "./util/secrets";
// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as userController from "./controllers/user";
import * as brokerController from "./controllers/brokers";
import * as deviceControllers from "./controllers/deviceControllers";
import * as deviceController from "./controllers/devices";
import * as logController from "./controllers/logs";
import * as topicController from "./controllers/topics";
// API keys and Passport configuration
import * as passportConfig from "./config/passport";

const MongoStore = mongo(session);

// Load environment variables from .env file, where API keys and passwords are configured
dotenv.config({path: ".env"});

// Create Express server
const app = express();

// Connect to MongoDB
const mongoUrl = MONGODB_URI;
(<any>mongoose).Promise = bluebird;
mongoose.connect(mongoUrl, {useMongoClient: true}).then(
    () => { /** ready to use. The `mongoose.connect()` promise resolves to undefined. */
    },
).catch(err => {
    console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
    // process.exit();
});

// Express configuration
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "pug");
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressValidator());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: SESSION_SECRET,
    store: new MongoStore({
        url: mongoUrl,
        autoReconnect: true
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});
app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    if (!req.user &&
        req.path !== "/login" &&
        req.path !== "/signup" &&
        !req.path.match(/^\/auth/) &&
        !req.path.match(/\./)) {
        req.session.returnTo = req.path;
    } else if (req.user &&
        req.path == "/account") {
        req.session.returnTo = req.path;
    }
    next();
});

app.use(
    express.static(path.join(__dirname, "public"), {maxAge: 31557600000})
);

/**
 * Primary app routes.
 */
app.get("/", homeController.index);
app.get("/login", userController.getLogin);
app.post("/login", userController.postLogin);
app.get("/logout", userController.logout);
app.get("/forgot", userController.getForgot);
app.post("/forgot", userController.postForgot);
app.get("/reset/:token", userController.getReset);
app.post("/reset/:token", userController.postReset);
app.get("/signup", userController.getSignup);
app.post("/signup", userController.postSignup);
app.get("/account", passportConfig.isAuthenticated, userController.getAccount);
app.post("/account/profile", passportConfig.isAuthenticated, userController.postUpdateProfile);
app.post("/account/password", passportConfig.isAuthenticated, userController.postUpdatePassword);
app.post("/account/delete", passportConfig.isAuthenticated, userController.postDeleteAccount);

/**
 * API routes
 */

/**
 * controllers
 */
app.post("/controllers/create", deviceControllers.isAuthenticated, deviceControllers.create);
app.get("/controllers/get", deviceControllers.isAuthenticated, deviceControllers.getController);
app.get("/controllers/get/topics", deviceControllers.isAuthenticated, deviceControllers.getControllerTopics);
app.get("/controllers/get/sensors", deviceControllers.isAuthenticated, deviceControllers.getControllerSensors);
app.get("/controllers/get/data", deviceControllers.isAuthenticated, deviceControllers.getControllerData);
app.post("/controllers/edit", deviceControllers.isAuthenticated, deviceControllers.editController);
app.post("/controllers/delete", deviceControllers.isAuthenticated, deviceControllers.deleteController);

/**
 * users
 */
app.post("/clients/create", userController.postLogin);
app.get("/clients/get", userController.postLogin);
app.get("/clients/get/permissions", userController.postLogin);
app.get("/clients/get/controllers", userController.postLogin);
app.post("/clients/edit", userController.postLogin);
app.post("/clients/delete", userController.postLogin);

/**
 * devices
 */
app.post("/devices/create", userController.postLogin);
app.get("/devices/get", userController.postLogin);
app.post("/devices/edit", userController.postLogin);
app.post("/devices/delete", userController.postLogin);

/**
 * brokers
 */
app.post("/brokers/create", userController.postLogin);
app.get("/brokers/get", userController.postLogin);
app.get("/brokers/get/users", userController.postLogin);
app.post("/brokers/edit", userController.postLogin);
app.post("/brokers/delete", userController.postLogin);

/**
 * logs
 */
app.get("/logs/get", userController.postLogin);

/**
 * topics
 */
app.get("/topics/get", userController.postLogin);
app.post("/topics/create", userController.postLogin);

export default app;