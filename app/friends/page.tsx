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
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('friends_profile')
      if (cached) {
        try {
          return JSON.parse(cached)
        } catch {
          return null
        }
      }
    }
    return null
  });
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('friends_all_users')
      if (cached) {
        try {
          return JSON.parse(cached)
        } catch {
          return []
        }
      }
    }
    return []
  });
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.title = "Friends - Kothaa";
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserProfile(user.uid), getAllUsers(user.uid)]).then(([p, users]) => {
      setProfile(p);
      setAllUsers(users);
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('friends_profile', JSON.stringify(p))
        localStorage.setItem('friends_all_users', JSON.stringify(users))
      }
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

  const friendIds = profile?.friends || [];
  const friends = allUsers.filter((u) => friendIds.includes(u.uid));
  const filteredFriends = friends.filter((f) => f.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

  const showSkeleton = friends.length === 0 && !profile && typeof window !== 'undefined' && !localStorage.getItem('friends_profile');

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="sticky top-0 bg-base-100 z-10 pt-3 md:pt-4 px-4 md:px-6 pb-2">
        <div className="flex justify-between items-center mb-3">
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
      </div>

      <div className="flex-1 px-4 md:px-6 pb-4 space-y-2">
      
      {showSkeleton ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center rounded-xl p-2 gap-3 animate-pulse">
            <div className="w-[50px] h-[50px] rounded-full bg-base-300" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-base-300 rounded w-32" />
              <div className="h-3 bg-base-300 rounded w-20" />
            </div>
          </div>
        ))
      ) : filteredFriends.length === 0 ? (
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
              {friend.profileImage && friend.profileImage !== "/favicon.ico" ? (
                <Image width={50} height={50} className="rounded-full" src={friend.profileImage} alt={friend.displayName} />
              ) : (
                <div className="w-[50px] h-[50px] rounded-full bg-base-300 flex items-center justify-center">
                  <svg className="w-6 h-6 text-base-content" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
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
    </div>
  );
}
