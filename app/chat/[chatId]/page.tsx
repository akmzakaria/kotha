"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  getMessages,
  sendMessage,
  getChatDetails,
  getAllUsers,
} from "@/lib/chatService";
import Image from "next/image";
import { Message } from "@/lib/chatService";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const chatId = params.chatId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserImage, setOtherUserImage] = useState("/favicon.ico");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !user) return;

    // Fetch chat info and messages
    const fetchChatData = async () => {
      try {
        const chatDetails = await getChatDetails(chatId);
        if (chatDetails) {
          const otherUserId = chatDetails.participants.find(
            (id: string) => id !== user.uid,
          );

          if (otherUserId) {
            const allUsers = await getAllUsers(user.uid);
            const otherUser = allUsers.find((u) => u.uid === otherUserId);
            if (otherUser) {
              setOtherUserName(otherUser.displayName);
              setOtherUserImage(otherUser.profileImage);
            }
          }
        }

        // Fetch messages
        const messagesData = await getMessages(chatId);
        setMessages(messagesData);
      } catch (error) {
        console.error("Error fetching chat data:", error);
      }

      setLoading(false);
    };

    fetchChatData();
  }, [chatId, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || !user) return;

    // Optimistic update: show message instantly
    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      chatId,
      senderId: user.uid,
      senderName: user.displayName || "Anonymous",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText("");
    setSending(true);

    try {
      const saved = await sendMessage(
        chatId,
        user.uid,
        user.displayName || "Anonymous",
        text,
      );
      // Replace the optimistic message with the real saved message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId
            ? { ...saved, timestamp: new Date(saved.timestamp) }
            : m,
        ),
      );
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setMessageText(text); // restore text
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-base-content/70">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base-100">
      {/* Chat Header */}
      <div className="bg-base-200 border-b border-base-300 p-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-base-300 rounded-full transition-colors md:hidden"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <Image
          width={40}
          height={40}
          className="rounded-full"
          src={otherUserImage}
          alt={otherUserName}
        />

        <div className="flex-1">
          <h2 className="font-semibold text-base-content">{otherUserName}</h2>
          <p className="text-xs text-base-content/70">Online</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-base-content/50">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === user?.uid ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg transition-opacity ${
                  message.senderId === user?.uid
                    ? "bg-primary text-primary-content"
                    : "bg-base-300 text-base-content"
                } ${
                  message.id.startsWith("optimistic-") ? "opacity-70" : "opacity-100"
                }`}
              >
                <p>{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.senderId === user?.uid
                      ? "text-primary-content/70"
                      : "text-base-content/50"
                  }`}
                >
                  {message.id.startsWith("optimistic-")
                    ? "Sending..."
                    : new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="bg-base-200 border-t border-base-300 p-4 flex gap-3"
      >
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-base-300 text-base-content px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sending}
          className="bg-primary hover:bg-primary/80 active:bg-primary/60 text-primary-content disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-colors"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}
