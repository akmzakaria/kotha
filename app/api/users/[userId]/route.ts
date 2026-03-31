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
    const { status } = body;
    const { userId } = await params;

    if (!status || !["online", "offline", "away"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await User.findOneAndUpdate(
      { uid: userId },
      {
        status,
        lastSeen: new Date(),
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Failed to update user status" },
      { status: 500 },
    );
  }
}
