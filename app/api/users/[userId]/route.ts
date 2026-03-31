import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await dbConnect();
    const body = await request.json();
    const { userId } = await params;
    const { status, bio, profileImage, displayName, action, targetUid } = body;

    const user = await User.findOne({ uid: userId });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updateQuery: any = {};

    // Status update
    if (status && ["online", "offline", "away"].includes(status)) {
      updateQuery.status = status;
      updateQuery.lastSeen = new Date();
    }

    // Bio update
    if (bio !== undefined) updateQuery.bio = bio;

    // Profile image update
    if (profileImage !== undefined) updateQuery.profileImage = profileImage;

    // Display name update
    if (displayName !== undefined) updateQuery.displayName = displayName;

    if (Object.keys(updateQuery).length > 0) {
      await User.updateOne({ uid: userId }, { $set: updateQuery });
    }

    // Friend request: send request to targetUid
    if (action === "send_request" && targetUid) {
      console.log(`[Friend Request] From ${userId} to ${targetUid}`);
      
      const target = await User.findOne({ uid: targetUid });
      if (!target) {
        console.log(`[Friend Request] Target user ${targetUid} not found`);
        return NextResponse.json({ error: "Target user not found" }, { status: 404 });
      }
      
      if (target.friends?.includes(userId)) {
        console.log(`[Friend Request] Already friends`);
        return NextResponse.json({ error: "Already friends" }, { status: 400 });
      }
      
      if (target.friendRequests?.includes(userId)) {
        console.log(`[Friend Request] Request already sent`);
        return NextResponse.json({ success: true, message: "Request already sent" });
      }
      
      const result = await User.updateOne(
        { uid: targetUid },
        { $addToSet: { friendRequests: userId } }
      );
      
      console.log(`[Friend Request] Update result:`, result);
      
      if (result.modifiedCount === 0 && result.matchedCount === 0) {
        return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
      }
    }

    // Accept friend request
    if (action === "accept_request" && targetUid) {
      await User.updateOne(
        { uid: userId },
        { $addToSet: { friends: targetUid }, $pull: { friendRequests: targetUid } }
      );
      await User.updateOne(
        { uid: targetUid },
        { $addToSet: { friends: userId } }
      );
    }

    // Decline friend request
    if (action === "decline_request" && targetUid) {
      await User.updateOne(
        { uid: userId },
        { $pull: { friendRequests: targetUid } }
      );
    }

    // Cancel friend request
    if (action === "cancel_request" && targetUid) {
      await User.updateOne(
        { uid: userId },
        { $pull: { friendRequests: targetUid } }
      );
    }

    // Unfriend
    if (action === "unfriend" && targetUid) {
      await User.updateOne(
        { uid: userId },
        { $pull: { friends: targetUid } }
      );
      await User.updateOne(
        { uid: targetUid },
        { $pull: { friends: userId } }
      );
    }

    // Block
    if (action === "block" && targetUid) {
      await User.updateOne(
        { uid: userId },
        { $addToSet: { blocked: targetUid }, $pull: { friends: targetUid } }
      );
    }

    // Unblock
    if (action === "unblock" && targetUid) {
      await User.updateOne(
        { uid: userId },
        { $pull: { blocked: targetUid } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("User Action Error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await dbConnect();
    const { userId } = await params;
    const user = await User.findOne({ uid: userId }).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      profileImage: user.profileImage,
      bio: user.bio || "",
      status: user.status,
      lastSeen: user.lastSeen,
      friends: user.friends || [],
      blocked: user.blocked || [],
      friendRequests: user.friendRequests || [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
