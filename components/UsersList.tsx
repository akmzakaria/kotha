"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { getAllUsers, getOrCreateChat } from "@/lib/chatService";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserProfile } from "@/lib/chatService";

export default function UsersList() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      console.log("Fetching users for user:", user.uid);
      const allUsers = await getAllUsers(user.uid);
      console.log("Fetched users:", allUsers);
      setUsers(allUsers);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error("Error fetching users:", errorMsg);
      setError(errorMsg);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleUserClick = async (userId: string, userName: string) => {
    try {
      const chatId = await getOrCreateChat(user!.uid, userId, userName);
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const statusColors: Record<string, string> = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-500",
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-bold mb-5">Users</h1>
        <p className="text-base-content/70">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-3xl font-bold">Users</h1>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-primary text-primary-content hover:bg-primary/80 rounded-lg text-sm font-medium transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
          <p className="font-semibold">Error loading users:</p>
          <p>{error}</p>
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-base-content/70 mb-4">No other users available</p>
          <p className="text-base-content/50 text-sm">
            Make sure you're connected to Firebase and other users have signed
            in.
          </p>
        </div>
      ) : (
        users.map((userItem) => (
          <div
            key={userItem.uid}
            onClick={() => handleUserClick(userItem.uid, userItem.displayName)}
            className="flex hover:bg-base-200 active:bg-base-300 transition-all duration-200 cursor-pointer items-center rounded-xl p-2 gap-3"
          >
            <div className="relative shrink-0">
              <Image
                width={50}
                height={50}
                className="rounded-full"
                src={userItem.profileImage}
                alt={userItem.displayName}
              />
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 ${
                  statusColors[userItem.status] || "bg-gray-500"
                } rounded-full border-2 border-gray-950`}
              />
            </div>

            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-semibold text-base-content truncate">
                {userItem.displayName}
              </span>
              <p className="text-sm text-base-content/70 capitalize">
                {userItem.status}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
