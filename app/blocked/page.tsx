"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getUserProfile, getAllUsers, unblockUser } from "@/lib/chatService";
import { UserProfile } from "@/lib/chatService";
import Image from "next/image";

export default function BlockedUsersPage() {
  const { user } = useAuth();
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

  const handleUnblock = async (targetUid: string) => {
    if (!user) return;
    await unblockUser(user.uid, targetUid);
    setProfile((prev) => prev ? { ...prev, blocked: prev.blocked.filter((id) => id !== targetUid) } : prev);
  };

  const filteredBlocked = (profile?.blocked || []).filter((blockedUid) => {
    const blockedUser = allUsers.find((u) => u.uid === blockedUid);
    return blockedUser?.displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4 md:p-6">
      <div className="flex justify-between items-center mb-5">
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
      
      {filteredBlocked.length === 0 ? (
        <p className="text-base-content/70">{searchQuery ? "No blocked users found" : "No blocked users"}</p>
      ) : (
        filteredBlocked.map((blockedUid) => {
          const blockedUser = allUsers.find((u) => u.uid === blockedUid);
          if (!blockedUser) return null;
          return (
            <div key={blockedUid} className="flex hover:bg-base-200 active:bg-base-300 transition-all duration-200 items-center rounded-xl p-2 gap-3">
              <div className="flex flex-col px-2 shrink-0">
                <Image width={50} height={50} className="rounded-full" src={blockedUser.profileImage} alt={blockedUser.displayName} />
              </div>
              
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-semibold text-base-content truncate">{blockedUser.displayName}</span>
                <p className="text-sm text-base-content/70 truncate">{blockedUser.email}</p>
              </div>
              
              <button onClick={() => handleUnblock(blockedUid)} className="px-4 py-2 bg-primary text-primary-content hover:bg-primary/80 rounded-lg text-sm font-medium transition-colors shrink-0">
                Unblock
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
