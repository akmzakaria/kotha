"use client"

import React, { useEffect, useState } from "react"
import { useAuth } from "@/app/context/AuthContext"
import { getUserChats } from "@/lib/chatService"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChatRoom } from "@/lib/chatService"

export default function ChatsList() {
  const { user } = useAuth()
  const router = useRouter()
  const [chats, setChats] = useState<ChatRoom[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('chats_list')
      if (cached) {
        try {
          return JSON.parse(cached).map((c: any) => ({
            ...c,
            lastMessageTime: c.lastMessageTime ? new Date(c.lastMessageTime) : null
          }))
        } catch {
          return []
        }
      }
    }
    return []
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    document.title = "Chats - Kothaa"
  }, [])

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const userChats = await getUserChats(user.uid)
        const sortedChats = [...userChats].sort((a, b) => {
          const timeA = new Date(a.lastMessageTime).getTime()
          const timeB = new Date(b.lastMessageTime).getTime()
          return timeB - timeA
        })
        setChats(sortedChats)
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('chats_list', JSON.stringify(sortedChats))
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [user])

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`)
  }

  const formatTime = (timestamp: Date) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInMins = Math.floor(diffInMs / 60000)
    const diffInHours = Math.floor(diffInMs / 3600000)
    const diffInDays = Math.floor(diffInMs / 86400000)

    if (diffInMins < 1) return "Just now"
    if (diffInMins < 60) return `${diffInMins}m ago`
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInDays < 7) return `${diffInDays}d ago`

    return date.toLocaleDateString()
  }

  const filteredChats = chats
    .filter((chat) => {
      const otherUserId = chat.participants.find((id) => id !== user?.uid)
      const otherUserName = otherUserId ? chat.participantNames[otherUserId] : ""
      return (
        otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
    .sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
      return timeB - timeA
    })

  const showSkeleton = chats.length === 0 && typeof window !== 'undefined' && !localStorage.getItem('chats_list');

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 bg-base-100 z-10 p-3 md:p-4 pb-2">
        <div className="flex justify-between items-center mb-3">
          {/* <Image src="/logo.png" alt="Kothaa" width={64} height={64} /> */}

          <h1 className="text-3xl font-bold">Kothaa</h1>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="p-2 hover:bg-base-200 rounded-full transition-colors"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>

        {searchOpen && (
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-base-200 text-base-content px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
            autoFocus
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-4 space-y-2">
        {showSkeleton ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center rounded-xl p-2 gap-3 animate-pulse">
              <div className="w-[50px] h-[50px] rounded-full bg-base-300" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 bg-base-300 rounded w-32" />
                  <div className="h-3 bg-base-300 rounded w-16" />
                </div>
                <div className="h-3 bg-base-300 rounded w-48" />
              </div>
            </div>
          ))
        ) : filteredChats.length === 0 ? (
          <p className="text-base-content/70">
            {searchQuery
              ? "No chats found"
              : "No chats yet. Start by adding a user!"}
          </p>
        ) : (
          filteredChats.map((chat) => {
            const otherUserId = chat.participants.find((id) => id !== user?.uid)
            const otherUserName = otherUserId
              ? chat.participantNames[otherUserId]
              : "Unknown"
            const profileImage = otherUserId && chat.participantImages?.[otherUserId]
              ? chat.participantImages[otherUserId]
              : `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserName}`
            const unreadCount = chat.unreadCount?.[user?.uid || ""] || 0
            const hasUnread = unreadCount > 0

            return (
              <div
                key={chat.id}
                className={`flex hover:bg-base-200 active:bg-base-300 transition-all duration-200 items-center rounded-xl p-2 gap-3 ${
                  hasUnread ? "bg-primary/10" : ""
                }`}
              >
                <div
                  className="flex flex-col px-2 shrink-0 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/user/${otherUserId}`)
                  }}
                >
                  <Image
                    width={50}
                    height={50}
                    className="rounded-full"
                    src={profileImage}
                    alt={otherUserName}
                  />
                </div>

                <div
                  className="flex flex-col flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span
                      className={`font-semibold text-base-content truncate ${hasUnread ? "font-bold" : ""}`}
                    >
                      {otherUserName}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-base-content/50">
                        {formatTime(chat.lastMessageTime)}
                      </span>
                      {hasUnread && (
                        <span className="bg-primary text-primary-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p
                    className={`text-sm text-base-content/70 truncate ${hasUnread ? "font-semibold" : ""}`}
                  >
                    {chat.lastMessage || "No messages yet"}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
