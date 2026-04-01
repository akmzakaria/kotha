import { NextRequest, NextResponse } from "next/server";

const typingUsers = new Map<string, { userId: string; timestamp: number }>();

export async function POST(request: NextRequest) {
  try {
    const { chatId, userId, isTyping } = await request.json();

    if (!chatId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const key = `${chatId}:${userId}`;

    if (isTyping) {
      typingUsers.set(key, { userId, timestamp: Date.now() });
    } else {
      typingUsers.delete(key);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating typing status:", error);
    return NextResponse.json({ error: "Failed to update typing status" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const currentUserId = searchParams.get("currentUserId");

    if (!chatId || !currentUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Clean up old typing indicators (older than 5 seconds)
    const now = Date.now();
    for (const [key, value] of typingUsers.entries()) {
      if (now - value.timestamp > 5000) {
        typingUsers.delete(key);
      }
    }

    // Get typing users for this chat (excluding current user)
    const typingInChat = Array.from(typingUsers.entries())
      .filter(([key]) => key.startsWith(`${chatId}:`) && !key.endsWith(`:${currentUserId}`))
      .map(([, value]) => value.userId);

    return NextResponse.json({ typingUsers: typingInChat });
  } catch (error) {
    console.error("Error getting typing status:", error);
    return NextResponse.json({ error: "Failed to get typing status" }, { status: 500 });
  }
}
