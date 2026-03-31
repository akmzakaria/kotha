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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Blocked Users</h1>
      
      {!profile?.blocked?.length ? (
        <div className="text-center py-12">
          <p className="text-base-content/60">No blocked users</p>
        </div>
      ) : (
        <div className="space-y-2">
          {profile.blocked.map((blockedUid) => {
            const blockedUser = allUsers.find((u) => u.uid === blockedUid);
            return (
              <div key={blockedUid} className="flex items-center justify-between gap-3 bg-base-200 rounded-xl p-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {blockedUser && (
                    <Image width={48} height={48} className="rounded-full" src={blockedUser.profileImage} alt={blockedUser.displayName} />
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-base-content truncate">{blockedUser?.displayName || blockedUid}</span>
                    <span className="text-sm text-base-content/60 truncate">{blockedUser?.email}</span>
                  </div>
                </div>
                <button onClick={() => handleUnblock(blockedUid)} className="px-4 py-2 bg-primary text-primary-content hover:bg-primary/80 rounded-lg text-sm font-medium transition-colors">
                  Unblock
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
