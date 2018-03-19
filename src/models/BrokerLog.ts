import mongoose from "mongoose";

const brokerLogSchema = new mongoose.Schema({
    event_data: [
        {
            event_type: String,
            event_body: String
        }
    ],
    _brokerID: mongoose.Schema.Types.ObjectId
}, {timestamps: true});

// export const User: UserType = mongoose.model<UserType>('User', userSchema);
const BrokerLog = mongoose.model("BrokerLog", brokerLogSchema);
export default BrokerLog;