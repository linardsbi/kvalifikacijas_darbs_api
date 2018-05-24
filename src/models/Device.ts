import mongoose from "mongoose";
import {DB} from "../util/helpers/queryHelper";
import DeviceController from "./DeviceController";

export type DeviceModel = mongoose.Document & {
    name: string,
    machine_name: string,
    _controllerID: mongoose.Schema.Types.ObjectId,
    used_pins: PinModel,
    associated_controller?: any
};

export type PinModel = mongoose.Document & {
    pin_name: string,
    information_type: string,
    pin_mode: string,
    suffix: string,
    lastWrite: string,
    equation: string
};

const pinSchema = new mongoose.Schema({
    pin_name: {type: String, max: 3},
    information_type: {type: String, required: true, default: "digital"},
    pin_mode: String,
    suffix: {type: String, max: 20},
    lastWrite: String,
    equation: String
});

const deviceSchema = new mongoose.Schema({
    name: String,
    machine_name: String,
    _controllerID: {type: mongoose.Schema.Types.ObjectId, ref: "DeviceController"},
    used_pins: { type: pinSchema, required: true }
}, { timestamps: true });

deviceSchema.virtual("associated_controller").get(async function() {
    return await DB.findById(DeviceController, this._controllerID);
});

deviceSchema.set("toJSON", {
    virtuals: true
});

const Device = mongoose.model("Device", deviceSchema);
export default Device;