import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { chatId, userId } = await request.json();

    if (!chatId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Mark all messages in this chat as seen by this user
    await Message.updateMany(
      { 
        chatId, 
        senderId: { $ne: userId },
        seenBy: { $ne: userId }
      },
      { $addToSet: { seenBy: userId } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    return NextResponse.json({ error: "Failed to mark messages as seen" }, { status: 500 });
  }
}
