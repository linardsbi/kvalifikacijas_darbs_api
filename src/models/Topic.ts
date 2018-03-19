import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
    details: {type: String, default: ""},
    _controllerID: mongoose.Schema.Types.ObjectId,
    _clientID: mongoose.Schema.Types.ObjectId
}, {timestamps: true});

// export const User: UserType = mongoose.model<UserType>('User', userSchema);
const Topic = mongoose.model("Topic", topicSchema);
export default Topic;