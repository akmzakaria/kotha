// Script to migrate all "away" statuses to "offline"
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kotha';

const userSchema = new mongoose.Schema({
  uid: String,
  displayName: String,
  email: String,
  profileImage: String,
  status: { type: String, enum: ["online", "offline"], default: "offline" },
  lastSeen: Date,
  friends: [String],
  friendRequests: [String],
  blocked: [String],
  blockedBy: [String],
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function migrateAwayStatus() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      { status: 'away' },
      { $set: { status: 'offline' } }
    );

    console.log(`Migration complete: ${result.modifiedCount} users updated from "away" to "offline"`);
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateAwayStatus();
