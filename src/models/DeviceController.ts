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
    devices: [
        {_deviceID: mongoose.Schema.Types.ObjectId}
    ],
    topics: [
        {
            _topicID: mongoose.Schema.Types.ObjectId,
            source: Number,
            destination: Number,
            protocol: String
        }
    ]
}, {timestamps: true});

const DeviceController = mongoose.model("DeviceController", deviceControllerSchema);
export default DeviceController;