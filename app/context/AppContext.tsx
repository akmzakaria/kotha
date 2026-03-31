"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  avatar: string;
  status?: string;
}

export interface Chat {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  lastMessage: string;
  timestamp: string;
}

interface AppContextType {
  users: User[];
  chats: Chat[];
  activeTab: "chats" | "users";
  setActiveTab: (tab: "chats" | "users") => void;
  addUser: (user: User) => void;
  addChat: (chat: Chat) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "AKM Zakaria", avatar: "/favicon.ico", status: "online" },
    { id: "2", name: "John Doe", avatar: "/favicon.ico", status: "offline" },
    { id: "3", name: "Jane Smith", avatar: "/favicon.ico", status: "online" },
    { id: "4", name: "Mike Johnson", avatar: "/favicon.ico", status: "away" },
    {
      id: "5",
      name: "Sarah Williams",
      avatar: "/favicon.ico",
      status: "online",
    },
  ]);

  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      userId: "1",
      userName: "AKM Zakaria",
      userAvatar: "/favicon.ico",
      lastMessage: "Hey! How are you?",
      timestamp: "10:30 AM",
    },
    {
      id: "2",
      userId: "2",
      userName: "John Doe",
      userAvatar: "/favicon.ico",
      lastMessage: "See you later!",
      timestamp: "9:15 AM",
    },
    {
      id: "3",
      userId: "3",
      userName: "Jane Smith",
      userAvatar: "/favicon.ico",
      lastMessage: "Thanks for the update",
      timestamp: "Yesterday",
    },
    {
      id: "4",
      userId: "4",
      userName: "Mike Johnson",
      userAvatar: "/favicon.ico",
      lastMessage: "Sounds good!",
      timestamp: "Yesterday",
    },
  ]);

  const [activeTab, setActiveTab] = useState<"chats" | "users">("chats");

  const addUser = (user: User) => {
    setUsers([...users, user]);
  };

  const addChat = (chat: Chat) => {
    setChats([...chats, chat]);
  };

  return (
    <AppContext.Provider
      value={{ users, chats, activeTab, setActiveTab, addUser, addChat }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
