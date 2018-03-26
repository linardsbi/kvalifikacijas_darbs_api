import mongoose from "mongoose";

export interface DeviceInterface {
    name: String,
    machine_name: String,
    _controllerID: mongoose.Schema.Types.ObjectId,
    used_pins: object
}

const pinSchema = new mongoose.Schema({
    pinName: String,
    information_type: {type: String, required: true, default: "digital"}
});

const deviceSchema = new mongoose.Schema({
    name: String,
    machine_name: String,
    _controllerID: mongoose.Schema.Types.ObjectId,
    used_pins: [pinSchema]
}, { timestamps: true });

const Device = mongoose.model("Device", deviceSchema);
export default Device;