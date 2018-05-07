import mongoose from "mongoose";

export type DeviceModel = mongoose.Document & {
    name: String,
    machine_name: String,
    _controllerID: mongoose.Schema.Types.ObjectId,
    used_pins: PinModel
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

const Device = mongoose.model("Device", deviceSchema);
export default Device;