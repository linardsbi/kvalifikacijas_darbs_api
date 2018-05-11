import mongoose from "mongoose";

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
export interface ConditionalInterface {
    name: string;
    listenSubject: {subjectControllerID: mongoose.Schema.Types.ObjectId, pin_name: string, subjectControllerMachineName: string};
    triggerOn: {
        value: number[],
        condition: string,
        applyCalculation: boolean
    };
    run: { action: string, value: string, subjects: string[] }[];
}


const ConditionalSchema = new mongoose.Schema({
    name: String,
    listenSubject: {subjectControllerID: mongoose.Schema.Types.ObjectId, pin_name: String, subjectControllerMachineName: {type: String, default: "Conditional"}},
    triggerOn: {
        value: [Number],
        condition: String,
        applyCalculation: Boolean
    },
    run: [{ action: String, value: String, subjects: [String] }]
}, {timestamps: true});

const Conditional = mongoose.model("Conditional", ConditionalSchema);
export default Conditional;