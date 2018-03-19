import mongoose from "mongoose";

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

// export const User: UserType = mongoose.model<UserType>('User', userSchema);
const Device = mongoose.model("Device", deviceSchema);
export default Device;