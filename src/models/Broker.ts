import mongoose from "mongoose";

export interface BrokerInterface {
    static_ip: String;
    clients?: object;
}

const BrokerSchema = new mongoose.Schema({
    static_ip: {type: String, unique: true, required: true},
    clients: [
        { _clientID: mongoose.Schema.Types.ObjectId }
    ]
}, {timestamps: true});

const Broker = mongoose.model("Broker", BrokerSchema);
export default Broker;