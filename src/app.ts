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
import { MONGODB_URI, SESSION_SECRET } from "./util/secrets";
// Controllers (route handlers)
import * as homeController from "./controllers/home";
import * as userController from "./controllers/user";
import * as brokerController from "./controllers/brokers";
import * as deviceControllers from "./controllers/deviceControllers";
import * as deviceController from "./controllers/devices";
import * as logController from "./controllers/logs";
import * as topicController from "./controllers/topics";
import { isAuthenticated } from "./controllers/APIController";
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
app.post("/api/key", passportConfig.isAuthenticated, userController.setApiKey);
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
app.get("/dashboard", passportConfig.isAuthenticated, userController.getDashboard);
/**
 * API routes
 */

/**
 * TODO: Generalize authentication and create routes
 */

/**
 * controllers
 */
app.post("/controllers/create", isAuthenticated, deviceControllers.create);
app.get("/controllers/get", isAuthenticated, deviceControllers.read);
app.get("/controllers/get/topics", isAuthenticated, deviceControllers.getControllerTopics);
app.get("/controllers/get/devices", isAuthenticated, deviceControllers.getControllerDevices);
app.get("/controllers/get/data", isAuthenticated, deviceControllers.getControllerData);
app.patch("/controllers/edit", isAuthenticated, deviceControllers.update);
app.delete("/controllers/delete", isAuthenticated, deviceControllers.remove);

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
app.post("/devices/create", isAuthenticated, deviceController.create);
app.get("/devices/get", isAuthenticated, deviceController.read);
app.post("/devices/edit", isAuthenticated, deviceController.update);
app.post("/devices/delete", isAuthenticated, deviceController.remove);

/**
 * brokers
 */
app.post("/brokers/create", isAuthenticated, brokerController.create);
app.get("/brokers/get", isAuthenticated, brokerController.read);
app.get("/brokers/get/users", isAuthenticated, brokerController.read);
app.post("/brokers/edit", isAuthenticated, brokerController.update);
app.post("/brokers/delete", isAuthenticated, brokerController.remove);

/**
 * logs
 */
app.get("/logs/get", userController.postLogin);

/**
 * topics
 */
app.get("/topics/get", isAuthenticated, topicController.read);
app.post("/topics/create", isAuthenticated, topicController.create);

/**
 * data
 */
app.post("/data/post", isAuthenticated, brokerController.postData);

export default app;