import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    participants: [{ type: String, required: true }],
    participantNames: { type: Object, default: {} },
    lastMessage: { type: String, default: "" },
    lastMessageTime: { type: Date, default: Date.now },
    unreadCount: { type: Object, default: {} }, // { userId: count }
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);
