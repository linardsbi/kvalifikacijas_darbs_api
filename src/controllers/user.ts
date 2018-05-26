import async from "async";
import crypto from "crypto";
import nodemailer from "nodemailer";
import passport from "passport";
import {default as User, UserModel, AuthToken} from "../models/User";
import {Request, Response, NextFunction} from "express";
import {IVerifyOptions} from "passport-local";
import {WriteError} from "mongodb";
import DeviceController, {ControllerModel} from "../models/DeviceController";
import {default as Device} from "../models/Device";


const request = require("express-validator");
import {JwtToken as jwt} from "../util/helpers/jwtToken";
import {DB} from "../util/helpers/queryHelper";
import { Email } from "../util/helpers/sendEmail";
import PublishedData from "../models/PublishedData";
import Event from "../models/EventLog";
import {MongooseDocument} from "mongoose";
import {EventHandler} from "../util/helpers/eventHandling";

/**
 * GET /login
 * Login page.
 */
export let getLogin = (req: Request, res: Response) => {
    if (req.user) {
        return res.redirect("/");
    }
    res.render("account/login", {
        title: "Login"
    });
};

/**
 * GET /stats
 * Statistics page.
 */
export const getSiteStats = async (req: Request, res: Response) => {
    const users = await DB.find(User, {role: "user"});
    const admins = await DB.find(User, {role: "admin"});

    if (req.user.role !== "admin") {
        req.flash("errors", {msg: "Insufficient permission"});
        return res.redirect("/");
    }

    res.render("account/stats", {
        title: "Site statistics",
        users: users,
        admins: admins
    });
};

type formattedSizeObj = {
    value: string;
    suffix: string;
};

function formatSize(size: number): formattedSizeObj {
    const formatted: formattedSizeObj = {
        value: "",
        suffix: "",
    };

    if ((size / 10000) > 1024) {
        formatted.value = (size / 1000000000000).toFixed(1);
        formatted.suffix = "GB";
    } else if ((size / 100) > 1000) {
        formatted.value = (size / 1000000).toFixed(1);
        formatted.suffix = "MB";
    } else if (size > 1000) {
        formatted.value = (size / 1000).toFixed(1);
        formatted.suffix = "KB";
    } else {
        formatted.value = size.toString();
        formatted.suffix = "B";
    }

    return formatted;
}

function getAllStats() {
    return new Promise((resolve) => {
        async.parallel({
            users: async (cb) => {
                const user = await User.findOne({});
                const stats = await user.collection.stats();
                cb(undefined, {size: formatSize(stats.size), count: stats.count, avgObjSize: formatSize(stats.avgObjSize)});
            },
            devices: async (cb) => {
                const device = await Device.findOne({});
                const stats = await device.collection.stats();
                cb(undefined, {size: formatSize(stats.size), count: stats.count, avgObjSize: formatSize(stats.avgObjSize)});
            },
            controllers: async (cb) => {
                const controller = await DeviceController.findOne({});
                const stats = await controller.collection.stats();
                cb(undefined, {size: formatSize(stats.size), count: stats.count, avgObjSize: formatSize(stats.avgObjSize)});
            },
            publishedData: async (cb) => {
                const data = await PublishedData.findOne({});
                const stats = await data.collection.stats();
                cb(undefined, {size: formatSize(stats.size), count: stats.count, avgObjSize: formatSize(stats.avgObjSize)});
            },
            events: async (cb) => {
                const data = await Event.findOne({});
                const stats = await data.collection.stats();
                cb(undefined, {size: formatSize(stats.size), count: stats.count, avgObjSize: formatSize(stats.avgObjSize)});
            }
        }, function (err, result) {
            resolve(result);
        });
    });
}

/**
 * GET /admin/stats
 * Admin statistics route.
 */
export const getAdminStats = async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    let decoded;

    if (req.headers.authtoken) {
        try {
            decoded = jwt.decodeToken(req.headers.authtoken.toString());
        } catch (e) {
            res.send(JSON.stringify({error: e.message}));
        }
    }

    if (req.user.role === "admin" || (decoded && decoded.role === "admin")) {
        try {
            const stats = await getAllStats();

            res.send(JSON.stringify(stats));
        } catch (e) {
            res.send(JSON.stringify({error: e.message}));
        }
    } else {
        res.send(JSON.stringify({error: "auth error"}));
    }
};

/**
 * POST /admin
 * Admin route.
 */
export const postAdmin = async (req: Request, res: Response) => {
    if (req.user.role !== "admin") {
        return res.send({error: "Insufficient permission"});
    }

    const uid = req.body.id;
    const user = await DB.findById<UserModel>(User, uid);

    if (req.body.action === "make")
        user.role = "admin";
    else if (req.body.action === "revoke")
        user.role = "user";

    user.save(function (err, user: UserModel) {
        if (err)
            return res.send(err);
        const subject = {
            _id: user._id,
            model: "User"
        };

        EventHandler.log("Info", `Got their role changed to "${req.body.action}"`, subject);

        return res.send({status: "success"});
    });

};

/**
 * GET /dashboard
 * Dashboard page.
 */
export let getDashboard = (req: Request, res: Response) => {
    DeviceController.find({_client_id: req.user.id})
        .populate("devices._id")
        .exec((err, controllers: ControllerModel) => {
        if (err) {
            req.flash("errors", err);
            return res.redirect("/");
        }

        res.render("account/dashboard", {
            title: "Dashboard",
            controllers: controllers
        });
    });
};

/**
 * POST /login
 * Sign in using email and password.
 */
export let postLogin = (req: Request, res: Response, next: NextFunction) => {
    req.assert("email", "Email is not valid").isEmail();
    req.assert("password", "Password cannot be blank").notEmpty();
    req.sanitize("email").normalizeEmail({gmail_remove_dots: false});

    const errors = req.validationErrors();

    if (errors) {
        req.flash("errors", errors);
        return res.redirect("/login");
    }

    passport.authenticate("local", (err: Error, user: UserModel, info: IVerifyOptions) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash("errors", info.message);
            return res.redirect("/login");
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            const subject = {
                _id: user._id,
                model: "User"
            };

            EventHandler.log("Info", "Logged in", subject);

            req.flash("success", {msg: "Success! You are logged in."});
            res.redirect(req.session.returnTo || "/");
        });
    })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
export let logout = (req: Request, res: Response) => {
    req.logout();
    res.redirect("/");
};

/**
 * GET /signup
 * Signup page.
 */
export let getSignup = (req: Request, res: Response) => {
    if (req.user) {
        return res.redirect("/");
    }
    res.render("account/signup", {
        title: "Create Account"
    });
};

/**
 * POST /signup
 * Create a new local account.
 */
export let postSignup = (req: Request, res: Response, next: NextFunction) => {
    req.assert("email", "Email is not valid").isEmail();
    req.assert("password", "Password must be at least 4 characters long").len({min: 4});
    req.assert("confirmPassword", "Passwords do not match").equals(req.body.password);
    req.sanitize("email").normalizeEmail({gmail_remove_dots: false});

    const errors = req.validationErrors();

    if (errors) {
        req.flash("errors", errors);
        return res.redirect("/signup");
    }

    const user = new User({
        email: req.body.email,
        password: req.body.password
    });

    User.findOne({email: req.body.email}, (err, existingUser) => {
        if (err) {
            return next(err);
        }
        if (existingUser) {
            req.flash("errors", {msg: "Account with that email address already exists."});
            return res.redirect("/signup");
        }
        user.save((err, user: UserModel) => {
            if (err) {
                return next(err);
            }

            const subject = {
                _id: user._id,
                model: "User"
            };

            EventHandler.log("Info", "Created an account", subject);

            req.logIn(user, (err) => {
                if (err) {
                    return next(err);
                }
                res.redirect("/");
            });
        });
    });
};

/**
 * GET /account
 * Profile page.
 */
export let getAccount = (req: Request, res: Response) => {
    res.render("account/profile", {
        title: "Account Management"
    });
};

/**
 * POST /account/profile
 * Update profile information.
 */
export let postUpdateProfile = (req: Request, res: Response, next: NextFunction) => {
    req.assert("email", "Please enter a valid email address.").isEmail();
    req.sanitize("email").normalizeEmail({gmail_remove_dots: false});

    const errors = req.validationErrors();

    if (errors) {
        req.flash("errors", errors);
        return res.redirect("/account");
    }

    User.findById(req.user.id, (err, user: UserModel) => {
        if (err) {
            return next(err);
        }
        const oldEmail = user.email;

        user.email = req.body.email || "";
        user.save((err: WriteError) => {
            if (err) {
                if (err.code === 11000) {
                    req.flash("errors", {msg: "The email address you have entered is already associated with an account."});
                    return res.redirect("/account");
                }
                return next(err);
            }
            const subject = {
                _id: user._id,
                model: "User"
            };

            EventHandler.log("Info", `Changed their email from ${oldEmail} to ${user.email}`, subject);

            req.flash("success", {msg: "Profile information has been updated."});
            res.redirect("/account");
        });
    });
};

/**
 * POST /account/password
 * Update current password.
 */
export let postUpdatePassword = (req: Request, res: Response, next: NextFunction) => {
    req.assert("password", "Password must be at least 4 characters long").len({min: 4});
    req.assert("confirmPassword", "Passwords do not match").equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        req.flash("errors", errors);
        return res.redirect("/account");
    }

    User.findById(req.user.id, (err, user: UserModel) => {
        if (err) {
            return next(err);
        }
        user.password = req.body.password;
        user.save((err: WriteError) => {
            if (err) {
                return next(err);
            }
            const subject = {
                _id: user._id,
                model: "User"
            };

            EventHandler.log("Info", "Changed their password", subject);

            req.flash("success", {msg: "Password has been changed."});
            res.redirect("/account");
        });
    });
};

/**
 * POST /account/delete
 * Delete user account.
 */
export let postDeleteAccount = (req: Request, res: Response, next: NextFunction) => {
    const id = (req.body.id && req.user.role === "admin") ? req.body.id : req.user.id;

    User.remove({_id: id}, (err) => {
        if (err) {
            return next(err);
        }
        req.logout();
        req.flash("info", {msg: "Your account has been deleted."});
        res.redirect("/");
    });
};


/**
 * GET /reset/:token
 * Reset Password page.
 */
export let getReset = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    User
        .findOne({passwordResetToken: req.params.token})
        .where("passwordResetExpires").gt(Date.now())
        .exec((err, user) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                req.flash("errors", {msg: "Password reset token is invalid or has expired."});
                return res.redirect("/forgot");
            }
            res.render("account/reset", {
                title: "Password Reset"
            });
        });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
export let postReset = (req: Request, res: Response, next: NextFunction) => {
    req.assert("password", "Password must be at least 4 characters long.").len({min: 4});
    req.assert("confirm", "Passwords must match.").equals(req.body.password);

    const errors = req.validationErrors();

    if (errors) {
        req.flash("errors", errors);
        return res.redirect("back");
    }

    async.waterfall([
        function resetPassword(done: Function) {
            User
                .findOne({passwordResetToken: req.params.token})
                .where("passwordResetExpires").gt(Date.now())
                .exec((err, user: any) => {
                    if (err) {
                        return next(err);
                    }
                    if (!user) {
                        req.flash("errors", {msg: "Password reset token is invalid or has expired."});
                        return res.redirect("back");
                    }
                    user.password = req.body.password;
                    user.passwordResetToken = undefined;
                    user.passwordResetExpires = undefined;
                    user.save((err: WriteError) => {
                        if (err) {
                            return next(err);
                        }
                        req.logIn(user, (err) => {
                            done(err, user);
                        });
                    });
                });
        },
        function sendResetPasswordEmail(user: UserModel, done: Function) {
            Email
                .from("admin@site.com")
                .to(user.email)
                .subject("Reset your password")
                .text("Your password was successfully reset!")
                .send(function (err: undefined | string[]) {
                    if (err)
                        req.flash("errors", err);
                    else
                        req.flash("success", {msg: "Success! Your password has been changed."});

                    done(err);
                });
        }
    ], (err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
};

/**
 * GET /forgot
 * Forgot Password page.
 */
export let getForgot = (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    res.render("account/forgot", {
        title: "Forgot Password"
    });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
export let postForgot = (req: Request, res: Response, next: NextFunction) => {
    req.assert("email", "Please enter a valid email address.").isEmail();
    req.sanitize("email").normalizeEmail({gmail_remove_dots: false});

    const errors = req.validationErrors();

    if (errors) {
        req.flash("errors", errors);
        return res.redirect("/forgot");
    }

    async.waterfall([
        function createRandomToken(done: Function) {
            crypto.randomBytes(16, (err, buf) => {
                const token = buf.toString("hex");
                done(err, token);
            });
        },
        function setRandomToken(token: AuthToken, done: Function) {
            User.findOne({email: req.body.email}, (err, user: any) => {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    req.flash("errors", {msg: "Account with that email address does not exist."});
                    return res.redirect("/forgot");
                }
                user.passwordResetToken = token;
                user.passwordResetExpires = Date.now() + 3600000; // 1 hour
                user.save((err: WriteError) => {
                    done(err, token, user);
                });
            });
        },
        function sendForgotPasswordEmail(token: AuthToken, user: UserModel, done: Function) {
            const emailText = `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`;

        Email
            .from("admin@site.com")
            .to(user.email)
            .subject("Reset your password")
            .text(emailText)
            .send(function (err: undefined | string[]) {
                if (err)
                    req.flash("errors", err);
                else
                    req.flash("info", {msg: `An e-mail has been sent to ${user.email} with further instructions.`});
                done(err);
            });
        }
    ], (err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/forgot");
    });
};

/**
 * POST /api/key
 * Generate a new api key.
 */
export let setApiKey = (req: Request, res: Response, next: NextFunction) => {
    User.findById(req.user.id, (err, user: UserModel) => {
        if (err) {
            return next(err);
        }
        user.apiKey = jwt.generateToken({id: user._id, role: user.role});
        user.save((err: WriteError) => {
            if (err) {
                return next(err);
            }
            req.flash("success", {msg: "API key successfully generated."});
            res.redirect("/account");
        });
    });
};