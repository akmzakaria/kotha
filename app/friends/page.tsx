"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getUserProfile, getAllUsers, getOrCreateChat } from "@/lib/chatService";
import { UserProfile } from "@/lib/chatService";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function FriendsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserProfile(user.uid), getAllUsers(user.uid)]).then(([p, users]) => {
      setProfile(p);
      setAllUsers(users);
      setLoading(false);
    });
  }, [user]);

  const handleFriendClick = async (friendUid: string, friendName: string) => {
    try {
      const chatId = await getOrCreateChat(user!.uid, friendUid, friendName);
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 p-4 md:p-6">
        <h1 className="text-3xl font-bold mb-5">Friends</h1>
        <p className="text-base-content/70">Loading...</p>
      </div>
    );
  }

  const friendIds = profile?.friends || [];
  const friends = allUsers.filter((u) => friendIds.includes(u.uid));
  const filteredFriends = friends.filter((f) => f.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-2 p-4 md:p-6">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold">Friends ({friends.length})</h1>
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
          placeholder="Search friends..."
          className="w-full bg-base-200 text-base-content px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
          autoFocus
        />
      )}
      
      {filteredFriends.length === 0 ? (
        <p className="text-base-content/70">{searchQuery ? "No friends found" : "No friends yet. Add some from the Users tab!"}</p>
      ) : (
        filteredFriends.map((friend) => (
          <div
            key={friend.uid}
            className="flex hover:bg-base-200 active:bg-base-300 transition-all duration-200 items-center rounded-xl p-2 gap-3"
          >
            <div 
              className="relative shrink-0 cursor-pointer" 
              onClick={() => router.push(`/user/${friend.uid}`)}
            >
              <Image width={50} height={50} className="rounded-full" src={friend.profileImage} alt={friend.displayName} />
              <div className={`absolute bottom-0 right-0 w-3 h-3 ${
                friend.status === "online" ? "bg-green-500" : friend.status === "away" ? "bg-yellow-500" : "bg-gray-500"
              } rounded-full border-2 border-base-100`} />
            </div>

            <div 
              className="flex flex-col flex-1 min-w-0 cursor-pointer" 
              onClick={() => handleFriendClick(friend.uid, friend.displayName)}
            >
              <span className="font-semibold text-base-content truncate">{friend.displayName}</span>
              <p className="text-sm text-base-content/70 capitalize">{friend.status}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
