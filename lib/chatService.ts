"use client";

import { User as FirebaseUser } from "firebase/auth";

export interface ChatRoom {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  profileImage: string;
  status: "online" | "offline" | "away";
  lastSeen: Date;
}

// Create or update user profile
export const createOrUpdateUserProfile = async (user: FirebaseUser) => {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uid: user.uid,
        displayName: user.displayName || "Anonymous",
        email: user.email,
        profileImage: user.photoURL || "/favicon.ico",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create/update user profile");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

// Get all users except current user
export const getAllUsers = async (
  currentUserId: string,
): Promise<UserProfile[]> => {
  try {
    console.log("getAllUsers called with currentUserId:", currentUserId);
    const response = await fetch(
      `/api/users?currentUserId=${encodeURIComponent(currentUserId)}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }

    const users = await response.json();
    console.log("Fetched users from API:", users);
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Get or create chat between two users
export const getOrCreateChat = async (
  currentUserId: string,
  otherUserId: string,
  otherUserName: string,
): Promise<string> => {
  try {
    const response = await fetch("/api/chats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentUserId,
        otherUserId,
        otherUserName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create/get chat");
    }

    const data = await response.json();
    return data.chatId;
  } catch (error) {
    console.error("Error getting or creating chat:", error);
    throw error;
  }
};

// Get user chats
export const getUserChats = async (userId: string): Promise<ChatRoom[]> => {
  try {
    const response = await fetch(
      `/api/chats?userId=${encodeURIComponent(userId)}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch chats");
    }

    const chats = await response.json();
    return chats;
  } catch (error) {
    console.error("Error fetching chats:", error);
    return [];
  }
};

// Get chat messages (Note: Real-time subscriptions not implemented with MongoDB.
// For real-time updates, consider using Socket.io or polling mechanism)
export const getMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const response = await fetch(
      `/api/messages?chatId=${encodeURIComponent(chatId)}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch messages");
    }

    const messages = await response.json();
    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
};

// Subscribe to chat messages in real-time (placeholder - not implemented with MongoDB)
export const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
) => {
  // For MongoDB, real-time subscriptions require additional setup
  // This is a placeholder that fetches messages once
  getMessages(chatId).then(callback);

  // Return a no-op unsubscribe function
  return () => {};
};

// Send a message
export const sendMessage = async (
  chatId: string,
  senderId: string,
  senderName: string,
  text: string,
) => {
  try {
    const response = await fetch("/api/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        senderId,
        senderName,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Get chat details
export const getChatDetails = async (chatId: string) => {
  try {
    const response = await fetch(`/api/chats/${encodeURIComponent(chatId)}`);

    if (!response.ok) {
      throw new Error("Failed to fetch chat details");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching chat details:", error);
    return null;
  }
};

// Update user status
export const updateUserStatus = async (
  userId: string,
  status: "online" | "offline" | "away",
) => {
  try {
    const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error("Failed to update user status");
    }
  } catch (error) {
    console.error("Error updating user status:", error);
  }
};
