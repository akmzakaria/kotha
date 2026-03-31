import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    text: { type: String, required: true },
    edited: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true, strict: false },
);

// Delete the cached model to ensure schema updates are picked up
if (mongoose.models.Message) {
  delete mongoose.models.Message;
}

export default mongoose.model("Message", MessageSchema);
