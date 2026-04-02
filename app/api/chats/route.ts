import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Chat from "@/lib/models/Chat";
import User from "@/lib/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const currentUser = await User.findOne({ uid: userId }).lean();
    const defaultUserIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
    
    const chats = await Chat.find({
      participants: userId,
    })
      .sort({ lastMessageTime: -1 })
      .lean();

    const participantIds = [...new Set(chats.flatMap(chat => chat.participants))];
    const participantUsers = await User.find({ uid: { $in: participantIds } }).lean();
    
    const userMap = new Map(participantUsers.map(u => [u.uid, u]));

    const formattedChats = chats.map((chat) => {
      const participantImages: { [key: string]: string } = {};
      
      chat.participants.forEach((pId: string) => {
        const pUser = userMap.get(pId);
        if (pUser) {
          const isBlockedByParticipant = pUser.blocked?.includes(userId);
          participantImages[pId] = isBlockedByParticipant ? defaultUserIcon : pUser.profileImage;
        }
      });

      return {
        id: chat._id.toString(),
        participants: chat.participants,
        participantNames: chat.participantNames || {},
        participantImages,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        unreadCount: chat.unreadCount || {},
        createdAt: chat.createdAt,
      };
    });

    return NextResponse.json(formattedChats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { currentUserId, otherUserId, otherUserName } = body;

    if (!currentUserId || !otherUserId || !otherUserName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if users are friends
    const currentUser = await User.findOne({ uid: currentUserId });
    const otherUser = await User.findOne({ uid: otherUserId });

    if (!currentUser || !otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if blocked
    if (currentUser.blocked?.includes(otherUserId) || otherUser.blocked?.includes(currentUserId)) {
      return NextResponse.json({ error: "Cannot chat with blocked user" }, { status: 403 });
    }

    // Check if friends
    if (!currentUser.friends?.includes(otherUserId)) {
      return NextResponse.json({ error: "You must be friends to chat" }, { status: 403 });
    }

    // Search for existing chat
    const existingChat = await Chat.findOne({
      participants: { $all: [currentUserId, otherUserId] },
    });

    if (existingChat) {
      return NextResponse.json({ chatId: existingChat._id.toString() });
    }

    const currentUserName = currentUser?.displayName || "Unknown";

    // Create new chat
    const newChat = new Chat({
      participants: [currentUserId, otherUserId],
      participantNames: {
        [currentUserId]: currentUserName,
        [otherUserId]: otherUserName,
      },
      lastMessage: "",
      lastMessageTime: new Date(),
      createdAt: new Date(),
    });

    await newChat.save();
    return NextResponse.json({ chatId: newChat._id.toString() });
  } catch (error) {
    console.error("Error creating/getting chat:", error);
    return NextResponse.json(
      { error: "Failed to create/get chat" },
      { status: 500 },
    );
  }
}
