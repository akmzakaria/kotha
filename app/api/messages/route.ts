import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import Chat from "@/lib/models/Chat";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    if (!chatId) return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });

    const messages = await Message.find({ chatId }).sort({ timestamp: 1 }).lean();
    return NextResponse.json(messages.map((msg) => ({
      id: msg._id.toString(),
      chatId: msg.chatId,
      senderId: msg.senderId,
      senderName: msg.senderName,
      text: msg.text,
      edited: msg.edited || false,
      deleted: msg.deleted || false,
      timestamp: msg.timestamp,
    })));
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { chatId, senderId, senderName, text } = await request.json();
    if (!chatId || !senderId || !senderName || !text)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    // Get chat and check if blocked
    const chat = await Chat.findById(chatId);
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    const receiverId = chat.participants.find((id: string) => id !== senderId);
    if (receiverId) {
      const User = (await import("@/lib/models/User")).default;
      const receiver = await User.findOne({ uid: receiverId });
      if (receiver?.blocked?.includes(senderId)) {
        return NextResponse.json({ error: "Cannot send message to this user" }, { status: 403 });
      }
    }

    const message = await Message.create({ chatId, senderId, senderName, text, timestamp: new Date() });
    await Chat.findByIdAndUpdate(chatId, { lastMessage: text, lastMessageTime: new Date() });

    return NextResponse.json({
      id: message._id.toString(),
      chatId: message.chatId,
      senderId: message.senderId,
      senderName: message.senderName,
      text: message.text,
      edited: false,
      timestamp: message.timestamp,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await dbConnect();
    const { messageId, text, senderId } = await request.json();
    if (!messageId || !text) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const message = await Message.findById(messageId);
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.senderId !== senderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    message.text = text;
    message.edited = true;
    await message.save();

    return NextResponse.json({ id: message._id.toString(), text: message.text, edited: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to edit message" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const { messageId, senderId } = await request.json();
    if (!messageId) return NextResponse.json({ error: "Missing messageId" }, { status: 400 });

    const message = await Message.findById(messageId);
    if (!message) return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.senderId !== senderId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    message.deleted = true;
    message.text = "This message has been deleted";
    await message.save();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
