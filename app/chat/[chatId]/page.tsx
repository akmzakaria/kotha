"use client"

import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/app/context/AuthContext"
import {
  getMessages,
  sendMessage,
  getChatDetails,
  getAllUsers,
  editMessage,
  deleteMessage,
  blockUser,
  unfriendUser,
  unblockUser,
  getUserProfile,
  sendFriendRequest,
  updateTypingStatus,
  getTypingUsers,
  markChatAsRead,
  markMessagesAsSeen,
} from "@/lib/chatService"
import Image from "next/image"
import { Message } from "@/lib/chatService"
import { useToast } from "@/components/ToastProvider"
import { useConfirm } from "@/components/ConfirmProvider"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { showConfirm } = useConfirm()
  const chatId = params.chatId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [loading, setLoading] = useState(true)
  const [otherUserName, setOtherUserName] = useState("")
  const [otherUserImage, setOtherUserImage] = useState("/favicon.ico")
  const [otherUserId, setOtherUserId] = useState("")
  const [isBlocked, setIsBlocked] = useState(false)
  const [isFriend, setIsFriend] = useState(false)
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null,
  )
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showScrollDown, setShowScrollDown] = useState(false)

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const container = messagesContainerRef.current
    try {
      if (container) {
        if (typeof container.scrollTo === "function") {
          try {
            container.scrollTo({ top: container.scrollHeight, behavior })
            return
          } catch (err) {
            // fallback
          }
        }
        container.scrollTop = container.scrollHeight
      } else if (typeof window !== "undefined") {
        try {
          window.scrollTo({
            top: Math.max(
              document.documentElement.scrollHeight,
              document.body.scrollHeight,
            ),
            behavior,
          })
        } catch (err) {
          window.scrollTo(
            0,
            Math.max(
              document.documentElement.scrollHeight,
              document.body.scrollHeight,
            ),
          )
        }
      }
    } catch (e) {
      console.error("scrollToBottom error:", e)
    }
  }

  const isUserNearBottom = (threshold = 100) => {
    const container = messagesContainerRef.current
    if (!container) return true
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <=
      threshold
    )
  }

  const userAtBottomRef = useRef(true)
  const lastMessageIdRef = useRef<string | null>(null);
  const autoScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!chatId || !user) return
    const fetchChatData = async () => {
      try {
        const chatDetails = await getChatDetails(chatId)
        if (chatDetails) {
          const otherId = chatDetails.participants.find(
            (id: string) => id !== user.uid,
          )
          if (otherId) {
            setOtherUserId(otherId)
            const [allUsers, currentProfile] = await Promise.all([
              getAllUsers(user.uid),
              getUserProfile(user.uid),
            ])
            const otherUser = allUsers.find((u) => u.uid === otherId)
            if (otherUser) {
              setOtherUserName(otherUser.displayName)
              setOtherUserImage(otherUser.profileImage)
            }
            setIsBlocked(currentProfile.blocked?.includes(otherId) || false)
            setIsFriend(currentProfile.friends?.includes(otherId) || false)
          }
        }
        const msgs = await getMessages(chatId)
        console.log(
          "Messages received:",
          msgs.filter((m: any) => m.deleted),
        )
        setMessages(msgs);
        // Remember last message id and attempt an initial scroll (a couple tries
        // help with production layout timing without forcing scroll on user).
        lastMessageIdRef.current = msgs.length ? msgs[msgs.length - 1].id : null;
        setTimeout(() => scrollToBottom("auto"), 50);
        setTimeout(() => scrollToBottom("auto"), 300);

        // Mark chat as read and messages as seen
        await Promise.all([
          markChatAsRead(chatId, user.uid),
          markMessagesAsSeen(chatId, user.uid),
        ])
      } catch (error) {
        console.error("Error fetching chat data:", error)
      }
      setLoading(false)
    }
    fetchChatData()

    // Poll for new messages every 2 seconds
    const interval = setInterval(async () => {
      try {
        const msgs = await getMessages(chatId)
        setMessages(msgs)
        // Mark as read and seen on each poll
        await Promise.all([
          markChatAsRead(chatId, user.uid),
          markMessagesAsSeen(chatId, user.uid),
        ])
      } catch (error) {
        console.error("Error polling messages:", error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [chatId, user])

  useEffect(() => {
    if (messages.length === 0) {
      lastMessageIdRef.current = null;
      return;
    }
    const lastId = messages[messages.length - 1]?.id || null;
    const prevLast = lastMessageIdRef.current;
    const isNewMessage = prevLast !== lastId;

    // Update whether user is near bottom
    userAtBottomRef.current = isUserNearBottom();

    // Only auto-scroll when a new message arrived and the user is already at bottom.
    // Use a short debounce to avoid racing with the user's scroll event.
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current)
      autoScrollTimerRef.current = null
    }

    if (isNewMessage) {
      if (userAtBottomRef.current) {
        scrollToBottom("smooth")
      } else {
        autoScrollTimerRef.current = setTimeout(() => {
          if (isUserNearBottom()) scrollToBottom("smooth")
          autoScrollTimerRef.current = null
        }, 150)
      }
    }

    lastMessageIdRef.current = lastId;
  }, [messages]);

  // Clear any pending timer on unmount
  useEffect(() => {
    return () => {
      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current)
        autoScrollTimerRef.current = null
      }
    }
  }, [])

  // Attach scroll listener to detect user's manual scrolling and whether
  // the container is scrolled up significantly so we can show a "scroll to latest" button.
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const onScroll = () => {
      const scrolledUp = container.scrollTop < container.clientHeight
      const nearBottom = isUserNearBottom(150)
      userAtBottomRef.current = nearBottom
      setShowScrollDown(scrolledUp && !nearBottom && messages.length > 0)
    }
    container.addEventListener("scroll", onScroll, { passive: true })
    // initialize
    onScroll()
    return () => container.removeEventListener("scroll", onScroll)
  }, [messages])

  // Poll for typing status
  useEffect(() => {
    if (!chatId || !user) return

    const interval = setInterval(async () => {
      const typingUsers = await getTypingUsers(chatId, user.uid)
      setIsTyping(typingUsers.length > 0)
    }, 1000)

    return () => {
      clearInterval(interval)
      // Clear typing status on unmount
      if (user) updateTypingStatus(chatId, user.uid, false)
    }
  }, [chatId, user])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = messageText.trim()
    if (!text || !user) return

    // Clear typing indicator
    if (typingTimeout) clearTimeout(typingTimeout)
    await updateTypingStatus(chatId, user.uid, false)

    const optimisticId = `optimistic-${Date.now()}`
    const optimisticMessage: Message = {
      id: optimisticId,
      chatId,
      senderId: user.uid,
      senderName: user.displayName || "Anonymous",
      text,
      edited: false,
      deleted: false,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, optimisticMessage])
    setMessageText("")
    setSending(true)

    try {
      const saved = await sendMessage(
        chatId,
        user.uid,
        user.displayName || "Anonymous",
        text,
      )
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId
            ? { ...saved, timestamp: new Date(saved.timestamp) }
            : m,
        ),
      )
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId))
      setMessageText(text)
    }
    setSending(false)
  }

  const handleEdit = async (msgId: string) => {
    if (!editText.trim() || !user) return
    try {
      await editMessage(msgId, user.uid, editText.trim())
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId ? { ...m, text: editText.trim(), edited: true } : m,
        ),
      )
    } catch (e) {
      console.error(e)
    }
    setEditingId(null)
    setEditText("")
  }

  const handleDelete = async (msgId: string) => {
    if (!user) return
    showConfirm({
      title: "Delete Message",
      message:
        "Are you sure you want to delete this message? This action cannot be undone.",
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          await deleteMessage(msgId, user.uid)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId
                ? { ...m, text: "This message has been deleted", deleted: true }
                : m,
            ),
          )
        } catch (e) {
          console.error(e)
        }
        setMenuMsgId(null)
      },
    })
  }

  const handleUnfriend = async () => {
    if (!user || !otherUserId) return
    showConfirm({
      title: "Unfriend User",
      message: "Are you sure you want to remove this person from your friends?",
      confirmText: "Unfriend",
      onConfirm: async () => {
        await unfriendUser(user.uid, otherUserId)
        setIsFriend(false)
        setShowChatMenu(false)
      },
    })
  }

  const handleAddFriend = async () => {
    if (!user || !otherUserId) return
    await sendFriendRequest(user.uid, otherUserId)
    setShowChatMenu(false)
  }

  const handleBlock = async () => {
    if (!user || !otherUserId) return
    showConfirm({
      title: "Block User",
      message:
        "Are you sure you want to block this user? You won't be able to message each other.",
      confirmText: "Block",
      onConfirm: async () => {
        await blockUser(user.uid, otherUserId)
        setIsBlocked(true)
        setShowChatMenu(false)
      },
    })
  }

  const handleUnblock = async () => {
    if (!user || !otherUserId) return
    await unblockUser(user.uid, otherUserId)
    setIsBlocked(false)
    setShowChatMenu(false)
  }

  if (loading) {
    return null
  }

  return (
    <div
      className="relative flex flex-col h-full bg-base-100 w-full max-w-full overflow-x-hidden"
      onClick={() => {
        setMenuMsgId(null)
        setShowChatMenu(false)
      }}
    >
      {/* Chat Header */}
      <div className="bg-base-200 border-b border-base-300 p-4 flex items-center gap-3 shrink-0">
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
          className="rounded-full cursor-pointer hover:opacity-80 transition-opacity"
          src={otherUserImage}
          alt={otherUserName}
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/user/${otherUserId}`)
          }}
        />
        <div className="flex-1">
          <h2 className="font-semibold text-base-content">{otherUserName}</h2>
          <p className="text-xs text-base-content/70">
            {isTyping ? "typing..." : "Online"}
          </p>
        </div>
        {/* Chat options menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setShowChatMenu(!showChatMenu)}
            className="p-2 hover:bg-base-300 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {showChatMenu && (
            <div className="absolute right-0 top-10 bg-base-200 border border-base-300 rounded-lg shadow-lg z-50 min-w-[140px]">
              <button
                onClick={() => {
                  router.push(`/user/${otherUserId}`)
                  setShowChatMenu(false)
                }}
                className="block w-full text-left px-4 py-2 hover:bg-base-300 text-sm text-base-content transition-colors"
              >
                View Profile
              </button>
              {isFriend ? (
                <button
                  onClick={handleUnfriend}
                  className="block w-full text-left px-4 py-2 hover:bg-base-300 text-sm text-base-content transition-colors"
                >
                  Unfriend
                </button>
              ) : (
                <button
                  onClick={handleAddFriend}
                  className="block w-full text-left px-4 py-2 hover:bg-base-300 text-sm text-primary transition-colors"
                >
                  Add Friend
                </button>
              )}
              {isBlocked ? (
                <button
                  onClick={handleUnblock}
                  className="block w-full text-left px-4 py-2 hover:bg-base-300 text-sm text-green-500 transition-colors"
                >
                  Unblock
                </button>
              ) : (
                <button
                  onClick={handleBlock}
                  className="block w-full text-left px-4 py-2 hover:bg-base-300 text-sm text-red-500 transition-colors"
                >
                  Block
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showScrollDown && (
        <button
          onClick={() => {
            scrollToBottom("smooth")
            setShowScrollDown(false)
          }}
          aria-label="Scroll to latest messages"
          className="absolute right-4 bottom-20 z-50 bg-primary text-primary-content p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v8.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 12.586V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 flex flex-col space-y-6"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-base-content/50">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === user?.uid
            const isDeleted = message.deleted === true
            if (message.text === "This message has been deleted") {
              console.log("Deleted message check:", {
                id: message.id,
                deleted: message.deleted,
                isDeleted,
                text: message.text,
              })
            }
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div className="relative group max-w-xs md:max-w-md break-words">
                  {/* Desktop: Three-dot menu trigger */}
                  {isOwn &&
                    !message.id.startsWith("optimistic-") &&
                    !isDeleted && (
                      <div
                        className="hidden md:block absolute -left-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setMenuMsgId(
                              menuMsgId === message.id ? null : message.id,
                            )
                          }
                          className="p-1 hover:bg-base-300 rounded-full"
                        >
                          <svg
                            className="w-4 h-4 text-base-content/50"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="5" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="19" r="1.5" />
                          </svg>
                        </button>
                        {menuMsgId === message.id && (
                          <div className="absolute right-full mr-2 top-0 bg-base-200 border border-base-300 rounded-lg shadow-lg z-50 min-w-[100px]">
                            <button
                              onClick={() => {
                                setEditingId(message.id)
                                setEditText(message.text)
                                setMenuMsgId(null)
                              }}
                              className="block w-full text-left px-3 py-2 hover:bg-base-300 text-sm text-base-content transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(message.id)}
                              className="block w-full text-left px-3 py-2 hover:bg-base-300 text-sm text-red-500 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                  {editingId === message.id ? (
                    <div
                      className="flex gap-2 items-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleEdit(message.id)
                          }
                          if (e.key === "Escape") setEditingId(null)
                        }}
                        className="bg-base-300 text-base-content px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none min-h-[40px] max-h-[200px]"
                        rows={2}
                      />
                      <button
                        onClick={() => handleEdit(message.id)}
                        className="text-primary text-sm font-semibold px-2 py-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-base-content/50 text-sm px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`px-4 py-2 rounded-lg transition-opacity break-words ${
                          isDeleted
                            ? "bg-base-200 text-base-content/60 italic"
                            : isOwn
                              ? "bg-primary text-primary-content"
                              : "bg-base-300 text-base-content"
                        } ${message.id.startsWith("optimistic-") ? "opacity-70" : "opacity-100"}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (
                            isOwn &&
                            !message.id.startsWith("optimistic-") &&
                            !isDeleted
                          ) {
                            setMenuMsgId(
                              menuMsgId === message.id ? null : message.id,
                            )
                          }
                        }}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.text}
                        </p>
                        <p
                          className={`text-xs mt-1 ${isOwn && !isDeleted ? "text-primary-content/70" : "text-base-content/50"}`}
                        >
                          {message.id.startsWith("optimistic-")
                            ? "Sending..."
                            : new Date(message.timestamp).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                          {message.edited && !isDeleted && (
                            <span className="ml-1">(edited)</span>
                          )}
                          {isOwn &&
                            !isDeleted &&
                            message.seenBy?.includes(otherUserId) && (
                              <span className="ml-2">· Seen</span>
                            )}
                        </p>
                      </div>

                      {/* Mobile: Icon buttons - only show when clicked */}
                      {isOwn &&
                        !message.id.startsWith("optimistic-") &&
                        !isDeleted &&
                        menuMsgId === message.id && (
                          <div className="md:hidden absolute -bottom-7 right-0 flex gap-3 mb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingId(message.id)
                                setEditText(message.text)
                                setMenuMsgId(null)
                              }}
                              className="hover:opacity-70 transition-opacity"
                            >
                              <svg
                                className="w-4 h-4 text-base-content"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(message.id)
                              }}
                              className="hover:opacity-70 transition-opacity"
                            >
                              <svg
                                className="w-4 h-4 text-red-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-base-300 px-4 py-3 rounded-lg">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-base-content/50 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="bg-base-100 p-4 flex gap-3 shrink-0 items-end"
      >
        <textarea
          value={messageText}
          onChange={(e) => {
            setMessageText(e.target.value)

            // Send typing indicator
            if (user && e.target.value.trim()) {
              updateTypingStatus(chatId, user.uid, true)

              // Clear previous timeout
              if (typingTimeout) clearTimeout(typingTimeout)

              // Stop typing after 3 seconds of inactivity
              const timeout = setTimeout(() => {
                updateTypingStatus(chatId, user.uid, false)
              }, 3000)
              setTypingTimeout(timeout)
            } else if (user) {
              updateTypingStatus(chatId, user.uid, false)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              if (user) updateTypingStatus(chatId, user.uid, false)
              handleSendMessage(e as any)
            }
          }}
          placeholder={
            isFriend
              ? "Type a message..."
              : "You must be friends to send messages"
          }
          className="flex-1 bg-base-300 text-base-content px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-w-0 resize-none min-h-[44px] max-h-[120px]"
          disabled={sending || !isFriend}
          rows={1}
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sending || !isFriend}
          className="bg-primary hover:bg-primary/80 active:bg-primary/60 text-primary-content disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-colors shrink-0 h-[44px]"
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  )
}
