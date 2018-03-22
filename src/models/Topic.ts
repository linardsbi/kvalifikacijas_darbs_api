import mongoose from "mongoose";

const topicSchema = new mongoose.Schema({
    details: {type: String, default: ""},
    full_name: String,
    _controllerID: mongoose.Schema.Types.ObjectId,
    _clientID: mongoose.Schema.Types.ObjectId
}, {timestamps: true});

const Topic = mongoose.model("Topic", topicSchema);
export default Topic;