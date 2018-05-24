import mongoose, {MongooseDocument} from "mongoose";

/*
   form example -
        listenSubject: { subjectControllerID: <ObjectID>, pin_name: "A3" },
        action: {
            triggerOn {
                value$gt: "30",
                applyCalculation: true
            },
            run: [
                { send: "email", subjects: ["test@test.com", "example@test.com"] },
                { write: "HIGH" subjects: ["D1", "D2"]},
                { send: "textMessage", subjects: ["28888888"] }
            ]
        },

     design principle -
        IF <select device> IS <select condition> <input value> and ...<optional input> THEN
            1. <select action> <select subject>
            2. <select action> <select subject>
            3. etc...
 */
export interface ConditionalInterface extends MongooseDocument {
    name: string;
    listenSubject: {
        subjectControllerID: mongoose.Schema.Types.ObjectId,
        pin_name: string
    };
    triggerOn: {
        value: number[],
        condition: string,
        applyCalculation: boolean
    };
    run: { action: string, value: string, subjects: string[] }[];
}

const RunSchema = new mongoose.Schema({
    action: String,
    value: String,
    subjects: [String]
}, { _id : false });

const ConditionalSchema = new mongoose.Schema({
    name: {type: String, max: 30},
    listenSubject: {
        subjectControllerID: {type: mongoose.Schema.Types.ObjectId, ref: "DeviceController"},
        pin_name: String
    },
    triggerOn: {
        value: [Number],
        condition: String,
        applyCalculation: Boolean
    },
    run: [RunSchema]
}, {timestamps: true});

const Conditional = mongoose.model("Conditional", ConditionalSchema);
export default Conditional;