import mongoose from "mongoose";

// controllers/<controller_machine_name>/<action>/<subject>

const topicSchema = new mongoose.Schema({
    controller_machine_name: String,
    action: String,
    subject: String,
    pin: {
        pin_name: String,
        information_type: String,
        pin_mode: String
    }
}, {timestamps: true});

topicSchema.virtual("full_name").get(function() {
    return `controllers/${this.protocol_name}/${this.action}`;
});

topicSchema.set("toJSON", {
    virtuals: true
});

const Topic = mongoose.model("Topic", topicSchema);
export default Topic;