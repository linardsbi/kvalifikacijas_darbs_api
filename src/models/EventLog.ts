import mongoose from "mongoose";


export type eventSubject = {
    _id?: mongoose.Schema.Types.ObjectId,
    model: string
};

export type EventLogModel = mongoose.Document & {
    event: string,
    event_subject: eventSubject,
    event_body: any
};

const EventSchema = new mongoose.Schema({
    event: String,
    event_subject: {
        _id: mongoose.Schema.Types.ObjectId,
        model: String
    },
    event_body: mongoose.Schema.Types.Mixed
}, {timestamps: true, versionKey: false});

const Event = mongoose.model("Event", EventSchema);
export default Event;