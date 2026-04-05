"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getAllUsers, getOrCreateChat, sendFriendRequest, blockUser, getUserProfile, cancelFriendRequest } from "@/lib/chatService";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/lib/chatService";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmProvider";

export default function UsersList() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [actionStates, setActionStates] = useState<Record<string, string | undefined>>({});
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    document.title = "Users - Kothaa";
  }, []);

  const fetchUsers = async () => {
    if (!user) return;
    try {
      const [allUsers, profile] = await Promise.all([
        getAllUsers(user.uid),
        getUserProfile(user.uid),
      ]);
      setUsers(allUsers);
      setCurrentProfile(profile);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchUsers(); }, [user]);

  const handleUserClick = async (userId: string, userName: string) => {
    if (!currentProfile?.friends?.includes(userId)) {
      showToast("You must be friends to start a chat. Send a friend request first!", "error");
      return;
    }
    try {
      const chatId = await getOrCreateChat(user!.uid, userId, userName);
      router.push(`/chat/${chatId}`);
    } catch (error: any) {
      showToast(error.message || "Cannot start chat", "error");
      console.error("Error creating chat:", error);
    }
  };

  const handleSendRequest = async (e: React.MouseEvent, targetUid: string) => {
    e.stopPropagation();
    try {
      console.log("Sending friend request to:", targetUid);
      await sendFriendRequest(user!.uid, targetUid);
      setActionStates((prev) => ({ ...prev, [targetUid]: "sent" }));
    } catch (error: any) {
      console.error("Failed to send friend request:", error);
      showToast(error.message || "Failed to send friend request", "error");
    }
  };

  const handleCancelRequest = async (e: React.MouseEvent, targetUid: string) => {
    e.stopPropagation();
    showConfirm({
      title: "Cancel Friend Request",
      message: "Are you sure you want to cancel this friend request?",
      confirmText: "Cancel Request",
      onConfirm: async () => {
        try {
          await cancelFriendRequest(user!.uid, targetUid);
          setActionStates((prev) => ({ ...prev, [targetUid]: undefined }));
          await fetchUsers();
        } catch (error: any) {
          console.error("Failed to cancel request:", error);
          showToast(error.message || "Failed to cancel request", "error");
        }
      }
    });
  };

  const handleBlock = async (e: React.MouseEvent, targetUid: string) => {
    e.stopPropagation();
    showConfirm({
      title: "Block User",
      message: "Are you sure you want to block this user? You won't be able to message each other.",
      confirmText: "Block",
      onConfirm: async () => {
        await blockUser(user!.uid, targetUid);
        await fetchUsers();
      }
    });
  };

  const statusColors: Record<string, string> = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-500",
  };

  const filteredUsers = users.filter((u) => !currentProfile?.blocked?.includes(u.uid))
    .filter((u) => u.displayName.toLowerCase().includes(searchQuery.toLowerCase()));

  const showSkeleton = users.length === 0 && !currentProfile && typeof window !== 'undefined' && !localStorage.getItem('users_list');

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 bg-base-100 z-10 p-3 md:p-4 pb-2">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-3xl font-bold">Users</h1>
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
            placeholder="Search users..."
            className="w-full bg-base-200 text-base-content px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            autoFocus
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 space-y-2">

      {showSkeleton ? (
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center rounded-xl p-2 gap-3 animate-pulse">
            <div className="w-[50px] h-[50px] rounded-full bg-base-300" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-base-300 rounded w-32" />
              <div className="h-3 bg-base-300 rounded w-20" />
            </div>
            <div className="h-8 w-20 bg-base-300 rounded-lg" />
          </div>
        ))
      ) : (
        filteredUsers.map((userItem) => {
        const isFriend = currentProfile?.friends?.includes(userItem.uid);
        const requestSent = actionStates[userItem.uid] === "sent" || userItem.friendRequests?.includes(currentProfile?.uid || "");

        return (
          <div
            key={userItem.uid}
            className="flex hover:bg-base-200 active:bg-base-300 transition-all duration-200 items-center rounded-xl p-2 gap-3"
          >
            <div 
              className="relative shrink-0 cursor-pointer" 
              onClick={() => router.push(`/user/${userItem.uid}`)}
            >
              {userItem.profileImage && userItem.profileImage !== "/favicon.ico" ? (
                <Image width={50} height={50} className="rounded-full" src={userItem.profileImage} alt={userItem.displayName} />
              ) : (
                <div className="w-[50px] h-[50px] rounded-full bg-base-300 flex items-center justify-center">
                  <svg className="w-6 h-6 text-base-content" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
              <div className={`absolute bottom-0 right-0 w-3 h-3 ${statusColors[userItem.status] || "bg-gray-500"} rounded-full border-2 border-base-100`} />
            </div>

            <div 
              className="flex flex-col flex-1 min-w-0 cursor-pointer" 
              onClick={() => handleUserClick(userItem.uid, userItem.displayName)}
            >
              <span className="font-semibold text-base-content truncate">{userItem.displayName}</span>
              <p className="text-sm text-base-content/70 capitalize">{userItem.status}</p>
            </div>

            <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
              {!isFriend && (
                requestSent ? (
                  <button
                    onClick={(e) => handleCancelRequest(e, userItem.uid)}
                    className="px-3 py-1 bg-base-300 text-base-content hover:bg-base-100 rounded-lg text-xs font-medium transition-colors"
                  >
                    Requested
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleSendRequest(e, userItem.uid)}
                    className="px-3 py-1 bg-primary text-primary-content hover:bg-primary/80 rounded-lg text-xs font-medium transition-colors"
                  >
                    Add Friend
                  </button>
                )
              )}
              <button
                onClick={(e) => handleBlock(e, userItem.uid)}
                className="px-3 py-1 bg-base-300 hover:bg-red-500 hover:text-white text-base-content/70 rounded-lg text-xs font-medium transition-colors"
              >
                Block
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
