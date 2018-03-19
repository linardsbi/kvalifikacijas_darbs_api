import mongoose from "mongoose";

const payloadSchema = new mongoose.Schema({
    data_type: String,
    payload_body: String
});

const publishedDataSchema = new mongoose.Schema({
    _controllerID: mongoose.Schema.Types.ObjectId,
    payload: [payloadSchema],
}, { timestamps: true });

// export const User: UserType = mongoose.model<UserType>('User', userSchema);
const PublishedData = mongoose.model("PublishedData", publishedDataSchema);
export default PublishedData;