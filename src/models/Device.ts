import mongoose from "mongoose";
import {DB} from "../util/helpers/queryHelper";
import DeviceController from "./DeviceController";

export type DeviceModel = mongoose.Document & {
    name: String,
    machine_name: String,
    _controllerID: mongoose.Schema.Types.ObjectId,
    used_pins: PinModel
    controller_machine_name?: string
};

export type PinModel = mongoose.Document & {
    pin_name: string,
    information_type: string,
    pin_mode: string,
    suffix: string
};

const pinSchema = new mongoose.Schema({
    pin_name: String,
    information_type: {type: String, required: true, default: "digital"},
    pin_mode: String,
    suffix: String
});

const deviceSchema = new mongoose.Schema({
    name: String,
    machine_name: String,
    _controllerID: mongoose.Schema.Types.ObjectId,
    used_pins: { type: [pinSchema], required: true }
}, { timestamps: true });

deviceSchema.virtual("controller_machine_name").get(async function() {
    return await DB.findById(DeviceController, this._controllerID);
});

deviceSchema.set("toJSON", {
    virtuals: true
});

const Device = mongoose.model("Device", deviceSchema);
export default Device;