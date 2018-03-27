import mongoose from "mongoose";

export interface ControllerModel {
    id?: mongoose.Schema.Types.ObjectId;
    name?: String;
    machine_name?: String;
    devices?: object;
    topics?: object;
}

const deviceControllerSchema = new mongoose.Schema({
    name: String,
    machine_name: String,
    devices: [ { type: mongoose.Schema.Types.ObjectId } ],
    topics: [
        {
            _topicID: mongoose.Schema.Types.ObjectId,
            details: {type: String, default: "generic"},
            protocol_name: String,
        }
    ]
}, { timestamps: true, usePushEach: true});

const DeviceController = mongoose.model("DeviceController", deviceControllerSchema);
export default DeviceController;