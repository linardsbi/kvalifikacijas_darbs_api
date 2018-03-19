import crypto from "crypto";
import mongoose from "mongoose";

function generateSecret() {
    crypto.randomBytes(16, function (err: Error, buffer: any) {
        return buffer.toString("hex");
    });
}

const BrokerSchema = new mongoose.Schema({
    static_ip: {type: String, unique: true, required: true},
    secret: {type: String, unique: true, required: true, default: generateSecret()},
    clients: [
        {_clientID: mongoose.Schema.Types.ObjectId}
    ]
}, {timestamps: true});

const Broker = mongoose.model("User", BrokerSchema);
export default Broker;