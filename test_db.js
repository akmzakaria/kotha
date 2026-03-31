require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {}).then(async () => {
    console.log("Connected to MongoDB");

    const userSchema = new mongoose.Schema(
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
            friendRequests: { type: [String], default: [] },
        },
        { timestamps: true },
    );

    const User = mongoose.models.User || mongoose.model("User", userSchema);

    // List all users
    const users = await User.find({});
    console.log("Users in DB:", users);

    process.exit(0);
});
