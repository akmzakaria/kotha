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
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredChats = chats.filter((chat) => {
    const otherUserId = chat.participants.find((id) => id !== user?.uid);
    const otherUserName = otherUserId ? chat.participantNames[otherUserId] : "";
    return otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
         <div className="flex items-center justify-center h-full p-4 md:p-6 h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00665C] mx-auto mb-4"></div>
          <p className="text-base-content/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold">Messages</h1>
        <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:bg-base-200 rounded-full transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
      
      {searchOpen && (
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chats..."
          className="w-full bg-base-200 text-base-content px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          autoFocus
        />
      )}
      
      {filteredChats.length === 0 ? (
        <p className="text-base-content/70">{searchQuery ? "No chats found" : "No chats yet. Start by adding a user!"}</p>
      ) : (
        filteredChats.map((chat) => {
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
