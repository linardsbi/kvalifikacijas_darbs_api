import bcrypt from "bcrypt-nodejs";
import mongoose from "mongoose";
import { DeviceModel } from "./Device";

export type UserModel = mongoose.Document & {
    email: string,
    password: string,
    passwordResetToken: string,
    passwordResetExpires: Date,
    apiKey: string,
    role: string,
    controllers: [
        {
            _id: mongoose.Schema.Types.ObjectId | DeviceModel,
            machine_name: string
        }
        ],

    comparePassword: (candidatePassword: string, cb: (err: Error, isMatch: boolean) => {}) => void,
};

export type AuthToken = {
    accessToken: string,
    kind: string
};

export type APIToken = {
    _id: mongoose.Schema.Types.ObjectId,
    role: string
};

const userSchema = new mongoose.Schema({
    email: {type: String, unique: true, max: 30},
    password: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    apiKey: String,
    role: {type: String, default: "user", max: 30},

    controllers: [{
        _id: {type: mongoose.Schema.Types.ObjectId, ref: "DeviceController"},
        machine_name: {type: String, max: 30}
    }],
}, {timestamps: true, usePushEach: true});

/**
 * Password hash middleware.
 */
userSchema.pre("save", function save(next) {
    const user = this;
    if (!user.isModified("password")) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

userSchema.methods.comparePassword = function (candidatePassword: string, cb: (err: any, isMatch: any) => {}) {
    bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
        cb(err, isMatch);
    });
};

// export const User: UserType = mongoose.model<UserType>('User', userSchema);
const User = mongoose.model("User", userSchema);
export default User;