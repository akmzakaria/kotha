import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get("currentUserId");

    if (!currentUserId) {
      return NextResponse.json(
        { error: "Current user ID is required" },
        { status: 400 },
      );
    }

    const users = await User.find({ uid: { $ne: currentUserId } }).lean();

    const formattedUsers = users.map((user) => ({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      profileImage: user.profileImage,
      status: user.status,
      lastSeen: user.lastSeen,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { uid, displayName, email, profileImage } = body;

    if (!uid || !displayName || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const user = await User.findOneAndUpdate(
      { uid },
      {
        displayName,
        email,
        profileImage: profileImage || "/favicon.ico",
        status: "online",
        lastSeen: new Date(),
      },
      { upsert: true, returnDocument: "after" },
    );

    return NextResponse.json({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      profileImage: user.profileImage,
      status: user.status,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json(
      { error: "Failed to create/update user" },
      { status: 500 },
    );
  }
}
