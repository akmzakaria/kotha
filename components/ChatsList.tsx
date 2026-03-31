"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getUserChats, getAllUsers } from "@/lib/chatService";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChatRoom, UserProfile } from "@/lib/chatService";

export default function ChatsList() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [userChats, allUsers] = await Promise.all([
          getUserChats(user.uid),
          getAllUsers(user.uid),
        ]);
        setChats(userChats);
        setUsers(allUsers);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const formatTime = (timestamp: Date) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-bold mb-5">Messages</h1>
        <p className="text-base-content/70">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold mb-5">Messages</h1>
      {chats.length === 0 ? (
        <p className="text-base-content/70">No chats yet. Start by adding a user!</p>
      ) : (
        chats.map((chat) => {
          const otherUserId = chat.participants.find((id) => id !== user?.uid);
          const otherUserName = otherUserId
            ? chat.participantNames[otherUserId]
            : "Unknown";
          const otherUser = users.find((u) => u.uid === otherUserId);
          const profileImage =
            otherUser?.profileImage ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserName}`;

          return (
            <div
              key={chat.id}
              className="flex hover:bg-base-200 active:bg-base-300 transition-all duration-200 items-center rounded-xl p-2 gap-3"
            >
              <div 
                className="flex flex-col px-2 shrink-0 cursor-pointer" 
                onClick={(e) => { e.stopPropagation(); router.push(`/user/${otherUserId}`); }}
              >
                <Image
                  width={50}
                  height={50}
                  className="rounded-full"
                  src={profileImage}
                  alt={otherUserName}
                />
              </div>

              <div 
                className="flex flex-col flex-1 min-w-0 cursor-pointer" 
                onClick={() => handleChatClick(chat.id)}
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-base-content truncate">
                    {otherUserName}
                  </span>
                  <span className="text-xs text-base-content/50 shrink-0">
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                <p className="text-sm text-base-content/70 truncate">
                  {chat.lastMessage || "No messages yet"}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
