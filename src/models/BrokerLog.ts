import mongoose from "mongoose";

const brokerLogSchema = new mongoose.Schema({
    event_data: [
        {
            _id: false,
            event_type: String,
            event_body: String
        }
    ],
    _brokerID: {type: mongoose.Schema.Types.ObjectId, ref: "Brokers"}
}, {timestamps: true, versionKey: false});

// export const User: UserType = mongoose.model<UserType>('User', userSchema);
const BrokerLog = mongoose.model("BrokerLog", brokerLogSchema);
export default BrokerLog;