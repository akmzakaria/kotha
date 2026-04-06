"use client";

import { User as FirebaseUser } from "firebase/auth";
import { getCache, setCache, clearCache } from "./cache";

export interface ChatRoom {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  participantImages?: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount?: { [key: string]: number };
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  edited: boolean;
  deleted: boolean;
  seenBy?: string[];
  replyTo?: string | null;
  timestamp: Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  profileImage: string;
  bio: string;
  status: "online" | "offline" | "away";
  lastSeen: Date;
  friends: string[];
  blocked: string[];
  friendRequests: string[];
}

export const getBlockedUsers = async (userId: string): Promise<UserProfile[]> => {
  const response = await fetch(`/api/blocked?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error("Failed to fetch blocked users");
  return response.json();
};

export const createOrUpdateUserProfile = async (user: FirebaseUser) => {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: user.uid,
      displayName: user.displayName || "Anonymous",
      email: user.email,
      profileImage: user.photoURL || "/favicon.ico",
      emailVerified: user.emailVerified,
    }),
  });
  if (!response.ok) throw new Error("Failed to create/update user profile");
  return response.json();
};

export const getAllUsers = async (currentUserId: string): Promise<UserProfile[]> => {
  const cacheKey = `users_${currentUserId}`;
  const cached = getCache<UserProfile[]>(cacheKey);
  if (cached) return cached;
  
  const response = await fetch(`/api/users?currentUserId=${encodeURIComponent(currentUserId)}`);
  if (!response.ok) throw new Error("Failed to fetch users");
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const getUserProfile = async (userId: string, requesterId?: string): Promise<UserProfile> => {
  const cacheKey = `profile_${userId}_${requesterId || 'none'}`;
  const cached = getCache<UserProfile>(cacheKey);
  if (cached) return cached;
  
  const url = requesterId 
    ? `/api/users/${encodeURIComponent(userId)}?requesterId=${encodeURIComponent(requesterId)}`
    : `/api/users/${encodeURIComponent(userId)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch user profile");
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const updateUserProfile = async (userId: string, data: { bio?: string; profileImage?: string; displayName?: string }) => {
  const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update profile");
};

export const sendFriendRequest = async (fromUid: string, toUid: string) => {
  const response = await fetch(`/api/users/${encodeURIComponent(fromUid)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "send_request", targetUid: toUid }),
  });
  if (!response.ok) throw new Error("Failed to send friend request");
};

export const cancelFriendRequest = async (fromUid: string, toUid: string) => {
  await fetch(`/api/users/${encodeURIComponent(toUid)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "cancel_request", targetUid: fromUid }),
  });
};

export const acceptFriendRequest = async (userId: string, fromUid: string) => {
  await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "accept_request", targetUid: fromUid }),
  });
};

export const declineFriendRequest = async (userId: string, fromUid: string) => {
  await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "decline_request", targetUid: fromUid }),
  });
};

export const unfriendUser = async (userId: string, targetUid: string) => {
  await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "unfriend", targetUid }),
  });
};

export const blockUser = async (userId: string, targetUid: string) => {
  await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "block", targetUid }),
  });
};

export const unblockUser = async (userId: string, targetUid: string) => {
  await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "unblock", targetUid }),
  });
};

export const getOrCreateChat = async (currentUserId: string, otherUserId: string, otherUserName: string): Promise<string> => {
  const response = await fetch("/api/chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentUserId, otherUserId, otherUserName }),
  });
  if (!response.ok) throw new Error("Failed to create/get chat");
  const data = await response.json();
  return data.chatId;
};

export const getUserChats = async (userId: string, forceRefresh = false): Promise<ChatRoom[]> => {
  const cacheKey = `chats_${userId}`;
  
  if (!forceRefresh) {
    const cached = getCache<ChatRoom[]>(cacheKey);
    if (cached) return cached;
  }
  
  const response = await fetch(`/api/chats?userId=${encodeURIComponent(userId)}`);
  if (!response.ok) return [];
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const getMessages = async (chatId: string, userId: string, forceRefresh = false): Promise<Message[]> => {
  const cacheKey = `messages_${chatId}`;
  
  if (!forceRefresh) {
    const cached = getCache<Message[]>(cacheKey);
    if (cached) return cached;
  }
  
  const response = await fetch(`/api/messages?chatId=${encodeURIComponent(chatId)}&userId=${encodeURIComponent(userId)}`);
  if (!response.ok) return [];
  const data = await response.json();
  setCache(cacheKey, data);
  return data;
};

export const sendMessage = async (chatId: string, senderId: string, senderName: string, text: string, replyTo?: string) => {
  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, senderId, senderName, text, replyTo }),
  });
  if (!response.ok) throw new Error("Failed to send message");
  const data = await response.json();
  // Clear cache so next fetch gets fresh data
  clearCache(`messages_${chatId}`);
  return data;
};

export const editMessage = async (messageId: string, senderId: string, text: string) => {
  const response = await fetch("/api/messages", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId, senderId, text }),
  });
  if (!response.ok) throw new Error("Failed to edit message");
  const data = await response.json();
  // Cache will be refreshed on next fetch
  return data;
};

export const deleteMessage = async (messageId: string, senderId: string) => {
  const response = await fetch("/api/messages", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId, senderId }),
  });
  if (!response.ok) throw new Error("Failed to delete message");
};

export const getChatDetails = async (chatId: string) => {
  const response = await fetch(`/api/chats/${encodeURIComponent(chatId)}`);
  if (!response.ok) return null;
  return response.json();
};

export const updateUserStatus = async (userId: string, status: "online" | "offline" | "away") => {
  await fetch(`/api/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
};

export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  getMessages(chatId).then(callback);
  return () => {};
};

export const updateTypingStatus = async (chatId: string, userId: string, isTyping: boolean) => {
  await fetch("/api/typing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, userId, isTyping }),
  });
};

export const getTypingUsers = async (chatId: string, currentUserId: string): Promise<string[]> => {
  const response = await fetch(`/api/typing?chatId=${encodeURIComponent(chatId)}&currentUserId=${encodeURIComponent(currentUserId)}`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.typingUsers || [];
};

export const markChatAsRead = async (chatId: string, userId: string) => {
  await fetch(`/api/chats/${encodeURIComponent(chatId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, action: "mark_read" }),
  });
};

export const markMessagesAsSeen = async (chatId: string, userId: string) => {
  await fetch("/api/messages/seen", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, userId }),
  });
};

export const hideMessage = async (messageId: string, userId: string) => {
  await fetch("/api/messages/hide", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId, userId }),
  });
};
