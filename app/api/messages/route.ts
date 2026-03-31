import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import Chat from "@/lib/models/Chat";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 },
      );
    }

    const messages = await Message.find({ chatId })
      .sort({ timestamp: 1 })
      .lean();

    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      chatId: msg.chatId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      text: msg.text,
      timestamp: msg.timestamp,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { chatId, senderId, senderName, text } = body;

    if (!chatId || !senderId || !senderName || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create message
    const message = new Message({
      chatId,
      senderId,
      senderName,
      text,
      timestamp: new Date(),
    });

    await message.save();

    // Update chat last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: text,
      lastMessageTime: new Date(),
    });

    return NextResponse.json({
      id: message._id.toString(),
      chatId: message.chatId,
      senderId: message.senderId,
      senderName: message.senderName,
      text: message.text,
      timestamp: message.timestamp,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
