import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const currentUser = await User.findOne({ uid: userId }).lean();
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const blockedIds = currentUser.blocked || [];
    const blockedUsers = await User.find({ uid: { $in: blockedIds } }).lean();

    const formattedUsers = blockedUsers.map((user) => ({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      profileImage: user.profileImage,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    return NextResponse.json({ error: "Failed to fetch blocked users" }, { status: 500 });
  }
}
