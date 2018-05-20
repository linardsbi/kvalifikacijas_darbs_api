import mongoose from "mongoose";
import { DeviceModel } from "../models/Device";
import { TopicModel } from "../models/Topic";

export type ControllerModel = mongoose.Document & {
    _client_id: mongoose.Schema.Types.ObjectId;
    id?: mongoose.Schema.Types.ObjectId;
    name?: string;
    machine_name: string;
    devices?: [{
        _id: mongoose.Schema.Types.ObjectId,
        name: string
    }];
    topics?: TopicModel[];
};

const deviceControllerSchema = new mongoose.Schema({
    name: String,
    machine_name: {type: String, unique: true, required: true},
    _client_id: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    devices: [
        {
            _id: {type: mongoose.Schema.Types.ObjectId, ref: "Device"},
            name: String
        }
    ],
    topics: [
        {
            _topicID: mongoose.Schema.Types.ObjectId,
            details: {type: String, default: "generic"},
            protocol_name: String,
        }
    ]
}, {timestamps: true, usePushEach: true});

const DeviceController = mongoose.model("DeviceController", deviceControllerSchema);
export default DeviceController;