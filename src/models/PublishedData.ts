import mongoose from "mongoose";

type payloadModel = mongoose.Document & {
    data_type: String,
    payload_body: String
};

export type PublishedDataModel = mongoose.Document & {
    _deviceID: mongoose.Schema.Types.ObjectId,
    payload: payloadModel,
};

const payloadSchema = new mongoose.Schema({
    data_type: String,
    payload_body: String
});

const publishedDataSchema = new mongoose.Schema({
    _deviceID: mongoose.Schema.Types.ObjectId,
    payload: payloadSchema,
}, {timestamps: true});

publishedDataSchema.virtual("formatted_value").get(function () {
    // TODO: create data type formatting
    return `${this.payload.payload_body} ${this.payload.data_type}`;
});

publishedDataSchema.set("toJSON", {
    virtuals: true
});

// export const User: UserType = mongoose.model<UserType>("User", userSchema);
const PublishedData = mongoose.model("PublishedData", publishedDataSchema);
export default PublishedData;