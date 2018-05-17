import mongoose from "mongoose";
import {default as Device, DeviceModel } from "../models/Device";
import {DB} from "../util/helpers/queryHelper";

type payloadModel = mongoose.Document & {
    data_type: String,
    payload_body: String
};

export type PublishedDataModel = mongoose.Document & {
    device: {
        _id: mongoose.Schema.Types.ObjectId,
        name: string,
        pin_name: string
    },
    payload: payloadModel,
    pin_name: string,
};

const payloadSchema = new mongoose.Schema({
    data_type: String,
    payload_body: String
});

const publishedDataSchema = new mongoose.Schema({
    device: {
        _id: mongoose.Schema.Types.ObjectId,
        name: String,
        pin_name: String
    },
    pin_name: String,
    payload: payloadSchema,
}, {timestamps: true});

publishedDataSchema.virtual("formatted_value").get(function () {
    // TODO: create data type formatting
    if (this.payload.data_type)
        return `${this.payload.payload_body} ${this.payload.data_type}`;
    else
        return `${this.payload.payload_body}`;
});

publishedDataSchema.set("toJSON", {
    virtuals: true
});

// export const User: UserType = mongoose.model<UserType>("User", userSchema);
const PublishedData = mongoose.model("PublishedData", publishedDataSchema);
export default PublishedData;