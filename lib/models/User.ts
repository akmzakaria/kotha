import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    email: { type: String, required: true },
    profileImage: { type: String, default: "/favicon.ico" },
    bio: { type: String, default: "" },
    status: { type: String, enum: ["online", "offline", "away"], default: "offline" },
    lastSeen: { type: Date, default: Date.now },
    friends: { type: [String], default: [] },
    blocked: { type: [String], default: [] },
    friendRequests: { type: [String], default: [] }, // incoming request sender uids
    emailVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
