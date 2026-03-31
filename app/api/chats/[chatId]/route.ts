import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Chat from "@/lib/models/Chat";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    await dbConnect();

    const { chatId } = await params;
    const chat = await Chat.findById(chatId).lean();

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const chatDetails = {
      id: chat._id.toString(),
      participants: chat.participants,
      participantNames: chat.participantNames || {},
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageTime,
      createdAt: chat.createdAt,
    };

    return NextResponse.json(chatDetails);
  } catch (error) {
    console.error("Error fetching chat details:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat details" },
      { status: 500 },
    );
  }
}
