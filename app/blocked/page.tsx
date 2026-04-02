"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getBlockedUsers, unblockUser } from "@/lib/chatService";
import { UserProfile } from "@/lib/chatService";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function BlockedUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.title = "Blocked Users - Kothaa";
  }, []);

  const fetchBlockedUsers = async () => {
    if (!user) return;
    try {
      const users = await getBlockedUsers(user.uid);
      setBlockedUsers(users);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchBlockedUsers(); }, [user]);

  const handleUnblock = async (targetUid: string) => {
    if (!user) return;
    await unblockUser(user.uid, targetUid);
    await fetchBlockedUsers();
  };

  const filteredBlocked = blockedUsers.filter((blockedUser) => {
    return blockedUser?.displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <div className="sticky top-0 bg-base-100 z-10 pt-3 md:pt-4 px-4 md:px-6 pb-2">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-3xl font-bold">Blocked Users</h1>
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
            placeholder="Search blocked users..."
            className="w-full bg-base-200 text-base-content px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            autoFocus
          />
        )}
      </div>

      <div className="flex-1 px-4 md:px-6 pb-4 space-y-2">
      
      {filteredBlocked.length === 0 ? (
        <p className="text-base-content/70">{searchQuery ? "No blocked users found" : "No blocked users"}</p>
      ) : (
        filteredBlocked.map((blockedUser) => {
          return (
            <div key={blockedUser.uid} className="flex hover:bg-base-200 active:bg-base-300 transition-all duration-200 items-center rounded-xl p-2 gap-3">
              <div 
                className="flex flex-col px-2 shrink-0 cursor-pointer"
                onClick={() => router.push(`/user/${blockedUser.uid}`)}
              >
                {blockedUser.profileImage && blockedUser.profileImage !== "/favicon.ico" ? (
                  <Image width={50} height={50} className="rounded-full" src={blockedUser.profileImage} alt={blockedUser.displayName} />
                ) : (
                  <div className="w-[50px] h-[50px] rounded-full bg-base-300 flex items-center justify-center">
                    <svg className="w-6 h-6 text-base-content" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-base-content truncate">{blockedUser.displayName}</span>
              </div>
              
              <button onClick={() => handleUnblock(blockedUser.uid)} className="px-4 py-2 bg-primary text-primary-content hover:bg-primary/80 rounded-lg text-sm font-medium transition-colors shrink-0">
                Unblock
              </button>
            </div>
          );
        })
      )}
    </div>
    </div>
  );
}
