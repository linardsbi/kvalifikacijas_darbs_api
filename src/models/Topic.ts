import mongoose from "mongoose";

export type TopicModel = mongoose.Document & {
    details?: String;
    protocol_name: String,
    _sensorID: mongoose.Schema.Types.ObjectId,
    _controllerID: mongoose.Schema.Types.ObjectId,
    _clientID: mongoose.Schema.Types.ObjectId,
    full_name: Function
}

const topicSchema = new mongoose.Schema({
    details: {type: String, default: "generic"},
    protocol_name: {type:String, required: true},
    _sensorID: mongoose.Schema.Types.ObjectId,
    _controllerID: mongoose.Schema.Types.ObjectId,
    _clientID: mongoose.Schema.Types.ObjectId
}, {timestamps: true});

topicSchema.virtual('full_name').get(function() {
    return `${this._clientID}/${this.protocol_name}/${this.details}/${this._controllerID}/${this._sensorID}`;
});

topicSchema.set('toJSON', {
    virtuals: true
});

const Topic = mongoose.model("Topic", topicSchema);
export default Topic;