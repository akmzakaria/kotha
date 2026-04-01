"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getUserProfile, getAllUsers, acceptFriendRequest, declineFriendRequest } from "@/lib/chatService";
import { UserProfile } from "@/lib/chatService";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function RequestsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.title = "Friend Requests - Kothaa";
  }, []);

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserProfile(user.uid), getAllUsers(user.uid)]).then(([p, users]) => {
      setProfile(p);
      setAllUsers(users);
      setLoading(false);
    });
  }, [user]);

  const handleAccept = async (fromUid: string) => {
    if (!user) return;
    await acceptFriendRequest(user.uid, fromUid);
    setProfile((prev) => prev ? {
      ...prev,
      friends: [...prev.friends, fromUid],
      friendRequests: prev.friendRequests.filter((id) => id !== fromUid),
    } : prev);
  };

  const handleDecline = async (fromUid: string) => {
    if (!user) return;
    await declineFriendRequest(user.uid, fromUid);
    setProfile((prev) => prev ? {
      ...prev,
      friendRequests: prev.friendRequests.filter((id) => id !== fromUid),
    } : prev);
  };

  if (loading) {
   return null;
  }

  const requests = profile?.friendRequests || [];
  const filteredRequests = requests.filter((fromUid) => {
    const requester = allUsers.find((u) => u.uid === fromUid);
    return requester?.displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="sticky top-0 bg-base-100 z-10 pt-3 md:pt-4 px-4 md:px-6 pb-2">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-3xl font-bold">Friend Requests</h1>
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
            placeholder="Search requests..."
            className="w-full bg-base-200 text-base-content px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            autoFocus
          />
        )}
      </div>

      <div className="flex-1 px-4 md:px-6 pb-4 space-y-2">
      
      {filteredRequests.length === 0 ? (
        <p className="text-base-content/70">{searchQuery ? "No requests found" : "No friend requests"}</p>
      ) : (
        filteredRequests.map((fromUid) => {
          const requester = allUsers.find((u) => u.uid === fromUid);
          if (!requester) return null;
          return (
            <div
              key={fromUid}
              className="flex hover:bg-base-200 active:bg-base-300 transition-all duration-200 items-center rounded-xl p-2 gap-3"
            >
              <div 
                className="relative shrink-0 cursor-pointer" 
                onClick={() => router.push(`/user/${fromUid}`)}
              >
                {requester.profileImage && requester.profileImage !== "/favicon.ico" ? (
                  <Image width={50} height={50} className="rounded-full" src={requester.profileImage} alt={requester.displayName} />
                ) : (
                  <div className="w-[50px] h-[50px] rounded-full bg-base-300 flex items-center justify-center">
                    <svg className="w-6 h-6 text-base-content" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
                <div className={`absolute bottom-0 right-0 w-3 h-3 ${
                  requester.status === "online" ? "bg-green-500" : requester.status === "away" ? "bg-yellow-500" : "bg-gray-500"
                } rounded-full border-2 border-base-100`} />
              </div>

              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-base-content truncate">{requester.displayName}</span>
                <p className="text-sm text-base-content/70 capitalize">{requester.status}</p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleAccept(fromUid)}
                  className="px-3 py-1 bg-primary text-primary-content hover:bg-primary/80 rounded-lg text-xs font-medium transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDecline(fromUid)}
                  className="px-3 py-1 bg-base-300 hover:bg-base-100 text-base-content/70 rounded-lg text-xs font-medium transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
    </div>
  );
}
