'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import {
  getMessages,
  sendMessage,
  getChatDetails,
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
  hideMessage,
} from '@/lib/chatService'
import Image from 'next/image'
import { Message } from '@/lib/chatService'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmProvider'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { showToast } = useToast()
  const { showConfirm } = useConfirm()
  const chatId = (params?.chatId as string) || ''

  // Initialize messages from cache immediately
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`chat_${chatId}`)
      if (cached) {
        try {
          return JSON.parse(cached).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        } catch {
          return []
        }
      }
    }
    return []
  })
  const [messageText, setMessageText] = useState('')
  const [otherUserName, setOtherUserName] = useState('')
  const [otherUserImage, setOtherUserImage] = useState('/favicon.ico')
  const [otherUserId, setOtherUserId] = useState('')
  const [otherUserStatus, setOtherUserStatus] = useState<'online' | 'offline' | 'away'>('offline')
  const [isBlocked, setIsBlocked] = useState(false)
  const [isFriend, setIsFriend] = useState(true)
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [menuMsgId, setMenuMsgId] = useState<string | null>(null)
  const [showChatMenu, setShowChatMenu] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showScrollDown, setShowScrollDown] = useState(false)

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const container = messagesContainerRef.current
    try {
      if (container) {
        if (typeof container.scrollTo === 'function') {
          try {
            container.scrollTo({ top: container.scrollHeight, behavior })
            return
          } catch (err) {
            // fallback
          }
        }
        container.scrollTop = container.scrollHeight
      } else if (typeof window !== 'undefined') {
        try {
          window.scrollTo({
            top: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
            behavior,
          })
        } catch (err) {
          window.scrollTo(
            0,
            Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
          )
        }
      }
    } catch (e) {
      console.error('scrollToBottom error:', e)
    }
  }

  const isUserNearBottom = (threshold = 100) => {
    const container = messagesContainerRef.current
    if (!container) return true
    return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
  }

  const userAtBottomRef = useRef(true)
  const lastMessageIdRef = useRef<string | null>(null)
  const autoScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!chatId || !user) return
    const fetchChatData = async () => {
      try {
        const chatDetails = await getChatDetails(chatId)
        if (chatDetails) {
          const otherId = chatDetails.participants.find((id: string) => id !== user.uid)
          if (otherId) {
            setOtherUserId(otherId)
            const [otherProfile, currentProfile] = await Promise.all([
              getUserProfile(otherId, user.uid),
              getUserProfile(user.uid),
            ])
            setOtherUserName(otherProfile.displayName)
            setOtherUserImage(otherProfile.profileImage)
            setOtherUserStatus(otherProfile.status || 'offline')
            setIsBlocked(currentProfile.blocked?.includes(otherId) || false)
            setIsFriend(currentProfile.friends?.includes(otherId) || false)
          }
        }
        const msgs = await getMessages(chatId, user.uid)
        console.log(
          'Messages received:',
          msgs.filter((m: any) => m.deleted)
        )
        setMessages(msgs)
        // Save to localStorage for instant load next time
        if (typeof window !== 'undefined') {
          localStorage.setItem(`chat_${chatId}`, JSON.stringify(msgs))
        }
        // Remember last message id and attempt an initial scroll (a couple tries
        // help with production layout timing without forcing scroll on user).
        lastMessageIdRef.current = msgs.length ? msgs[msgs.length - 1].id : null
        setTimeout(() => scrollToBottom('auto'), 50)
        setTimeout(() => scrollToBottom('auto'), 300)

        // Mark chat as read and messages as seen
        await Promise.all([markChatAsRead(chatId, user.uid), markMessagesAsSeen(chatId, user.uid)])
      } catch (error) {
        console.error('Error fetching chat data:', error)
      }
    }
    fetchChatData()

    const interval = setInterval(async () => {
      try {
        const msgs = await getMessages(chatId, user.uid, true)
        setMessages((prev) => {
          // Keep optimistic messages that haven't been confirmed yet
          const optimisticMsgs = prev.filter((m) => m.id.startsWith('optimistic-'))
          // Merge with real messages, avoiding duplicates
          const updated = [...msgs, ...optimisticMsgs]
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem(`chat_${chatId}`, JSON.stringify(msgs))
          }
          return updated
        })

        // Update other user's status
        if (otherUserId) {
          try {
            const otherProfile = await getUserProfile(otherUserId, user.uid)
            setOtherUserStatus(otherProfile.status || 'offline')
          } catch (error) {
            console.error('Failed to fetch user status:', error)
          }
        }

        if (!document.hidden) {
          await Promise.all([
            markChatAsRead(chatId, user.uid),
            markMessagesAsSeen(chatId, user.uid),
          ])
        }
      } catch (error) {
        console.error('Error polling messages:', error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [chatId, user, otherUserId])

  useEffect(() => {
    if (messages.length === 0) {
      lastMessageIdRef.current = null
      return
    }
    const lastId = messages[messages.length - 1]?.id || null
    const prevLast = lastMessageIdRef.current
    const isNewMessage = prevLast !== lastId

    // Update whether user is near bottom
    userAtBottomRef.current = isUserNearBottom()

    // Only auto-scroll when a new message arrived and the user is already at bottom.
    // Use a short debounce to avoid racing with the user's scroll event.
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current)
      autoScrollTimerRef.current = null
    }

    if (isNewMessage) {
      if (userAtBottomRef.current) {
        scrollToBottom('smooth')
      } else {
        autoScrollTimerRef.current = setTimeout(() => {
          if (isUserNearBottom()) scrollToBottom('smooth')
          autoScrollTimerRef.current = null
        }, 150)
      }
    }

    lastMessageIdRef.current = lastId
  }, [messages])

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
      const scrolledDistance = container.scrollHeight - container.scrollTop - container.clientHeight
      const avgMessageHeight = 80
      const messagesScrolledPast = Math.floor(scrolledDistance / avgMessageHeight)
      const nearBottom = isUserNearBottom(150)
      userAtBottomRef.current = nearBottom
      setShowScrollDown(messagesScrolledPast >= 10 && messages.length > 0)
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    // initialize
    onScroll()
    return () => container.removeEventListener('scroll', onScroll)
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
      senderName: user.displayName || 'Anonymous',
      text,
      edited: false,
      deleted: false,
      replyTo: replyingTo?.id || null,
      timestamp: new Date(),
    }

    setSending(true)
    setMessages((prev) => [...prev, optimisticMessage])
    setMessageText('')
    const replyToId = replyingTo?.id
    setReplyingTo(null)

    try {
      const saved = await sendMessage(chatId, user.uid, user.displayName || 'Anonymous', text, replyToId)
      // Replace optimistic message with real one
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => m.id !== optimisticId)
        // Check if real message already exists (from polling)
        const realExists = withoutOptimistic.some((m) => m.id === saved.id)
        if (realExists) {
          return withoutOptimistic
        }
        return [...withoutOptimistic, { ...saved, timestamp: new Date(saved.timestamp) }]
      })
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
        prev.map((m) => (m.id === msgId ? { ...m, text: editText.trim(), edited: true } : m))
      )
    } catch (e) {
      console.error(e)
    }
    setEditingId(null)
    setEditText('')
  }

  const handleDelete = async (msgId: string) => {
    if (!user) return
    showConfirm({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message? This action cannot be undone.',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await deleteMessage(msgId, user.uid)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msgId ? { ...m, text: 'This message has been deleted', deleted: true } : m
            )
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
      title: 'Unfriend User',
      message: 'Are you sure you want to remove this person from your friends?',
      confirmText: 'Unfriend',
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
      title: 'Block User',
      message: "Are you sure you want to block this user? You won't be able to message each other.",
      confirmText: 'Block',
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

  const handleSearchMessages = () => {
    setSearchMode(true)
    setShowChatMenu(false)
  }

  const performSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setCurrentSearchIndex(0)
      return
    }
    const results = messages
      .filter(m => !m.deleted && m.text.toLowerCase().includes(query.toLowerCase()))
      .map(m => m.id)
    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)
    if (results.length > 0) {
      scrollToMessage(results[0])
    }
  }

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`msg-${messageId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleNextResult = () => {
    if (searchResults.length === 0) return
    const nextIndex = (currentSearchIndex + 1) % searchResults.length
    setCurrentSearchIndex(nextIndex)
    scrollToMessage(searchResults[nextIndex])
  }

  const handlePrevResult = () => {
    if (searchResults.length === 0) return
    const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length
    setCurrentSearchIndex(prevIndex)
    scrollToMessage(searchResults[prevIndex])
  }

  const closeSearch = () => {
    setSearchMode(false)
    setSearchQuery('')
    setSearchResults([])
    setCurrentSearchIndex(0)
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-300 text-black">{part}</mark>
        : part
    )
  }

  const showSkeleton = messages.length === 0 && !otherUserName && typeof window !== 'undefined' && !localStorage.getItem(`chat_${chatId}`) && !localStorage.getItem(`chat_details_${chatId}`)

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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        {showSkeleton ? (
          <>
            <div className="w-10 h-10 rounded-full bg-base-300 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-base-300 rounded w-32 animate-pulse" />
              <div className="h-3 bg-base-300 rounded w-20 animate-pulse" />
            </div>
          </>
        ) : (
          <>
            <div className="relative w-10 h-10 flex items-center justify-center bg-base-200 rounded-full">
              {otherUserImage && otherUserImage !== '/favicon.ico' ? (
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
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              ) : (
                <svg 
                  className="w-6 h-6 text-base-content/50 cursor-pointer" 
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                  onClick={(e) => {
                    e.stopPropagation()
                    router.push(`/user/${otherUserId}`)
                  }}
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-base-content">{otherUserName}</h2>
              <p className="text-xs text-base-content/70">
                {isTyping
                  ? 'typing...'
                  : otherUserStatus === 'online'
                    ? 'Online'
                    : otherUserStatus === 'away'
                      ? 'Away'
                      : 'Offline'}
              </p>
            </div>
          </>
        )}
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
              <button
                onClick={handleSearchMessages}
                className="block w-full text-left px-4 py-2 hover:bg-base-300 text-sm text-base-content transition-colors"
              >
                Search Chat
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

      {/* Search Bar */}
      {searchMode && (
        <div className="bg-base-200 border-b border-base-300 p-3 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              performSearch(e.target.value)
            }}
            placeholder="Search messages..."
            className="flex-1 min-w-0 bg-base-100 text-base-content px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            autoFocus
          />
          {searchResults.length > 0 && (
            <>
              <button
                onClick={handlePrevResult}
                className="p-2 hover:bg-base-300 rounded-full transition-colors shrink-0"
                title="Previous"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <span className="text-xs text-base-content/70 whitespace-nowrap shrink-0">
                {currentSearchIndex + 1}/{searchResults.length}
              </span>
              <button
                onClick={handleNextResult}
                className="p-2 hover:bg-base-300 rounded-full transition-colors shrink-0"
                title="Next"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={closeSearch}
            className="p-2 hover:bg-base-300 rounded-full transition-colors shrink-0"
            title="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {showScrollDown && (
        <button
          onClick={() => {
            scrollToBottom('smooth')
            setShowScrollDown(false)
          }}
          aria-label="Scroll to latest messages"
          className="absolute left-1/2 -translate-x-1/2 bottom-20 z-50 bg-primary text-primary-content p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v8.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 12.586V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 flex flex-col space-y-6"
      >
        {showSkeleton ? (
          <div className="flex flex-col space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] p-3 rounded-2xl ${i % 2 === 0 ? 'bg-primary/20' : 'bg-base-200'} animate-pulse`}
                >
                  <div className="h-4 bg-base-300 rounded w-48 mb-2" />
                  <div className="h-3 bg-base-300 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-base-content/50">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === user?.uid
            const isDeleted = message.deleted === true
            if (message.text === 'This message has been deleted') {
              console.log('Deleted message check:', {
                id: message.id,
                deleted: message.deleted,
                isDeleted,
                text: message.text,
              })
            }
            return (
              <div key={message.id} id={`msg-${message.id}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${searchResults.includes(message.id) && searchResults[currentSearchIndex] === message.id ? 'bg-primary/10 -mx-4 px-4 py-2' : ''}`}>
                <div className="relative group max-w-xs md:max-w-md break-words">
                  {/* Three-dot menu trigger */}
                  {!message.id.startsWith('optimistic-') && !isDeleted && (
                    <div
                      className={`hidden md:block absolute ${isOwn ? '-left-8' : '-right-8'} top-1 transition-opacity ${menuMsgId === message.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setMenuMsgId(menuMsgId === message.id ? null : message.id)}
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
                        <div className={`absolute ${isOwn ? 'right-full mr-2' : 'left-full ml-2'} top-0 bg-base-200 border border-base-300 rounded-lg shadow-lg z-50 min-w-[100px]`}>
                          <button
                            onClick={() => {
                              setReplyingTo(message)
                              setMenuMsgId(null)
                            }}
                            className="block w-full text-left px-3 py-2 hover:bg-base-300 text-sm text-base-content transition-colors"
                          >
                            Reply
                          </button>
                          {isOwn && (
                            <>
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
                            </>
                          )}
                          {!isOwn && (
                            <button
                              onClick={() => {
                                showConfirm({
                                  title: 'Hide Message',
                                  message: 'Are you sure you want to hide this message? It will only be hidden for you.',
                                  confirmText: 'Hide',
                                  onConfirm: async () => {
                                    await hideMessage(message.id, user!.uid)
                                    setMessages(prev => prev.filter(m => m.id !== message.id))
                                    setMenuMsgId(null)
                                  }
                                })
                              }}
                              className="block w-full text-left px-3 py-2 hover:bg-base-300 text-sm text-base-content transition-colors"
                            >
                              Hide
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {editingId === message.id ? (
                    <div className="flex gap-2 items-end" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleEdit(message.id)
                          }
                          if (e.key === 'Escape') setEditingId(null)
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
                            ? 'bg-base-200 text-base-content/60 italic'
                            : isOwn
                              ? 'bg-primary text-primary-content'
                              : 'bg-base-300 text-base-content'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          // Mobile only: click to open menu
                          if (window.innerWidth < 768 && !message.id.startsWith('optimistic-') && !isDeleted) {
                            setMenuMsgId(menuMsgId === message.id ? null : message.id)
                          }
                        }}
                      >
                        {message.replyTo && (
                          <div 
                            className={`mb-2 pb-2 border-l-2 pl-2 text-xs opacity-70 cursor-pointer hover:opacity-100 ${isOwn ? 'border-primary-content' : 'border-base-content'}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              const repliedMsgElement = document.getElementById(`msg-${message.replyTo}`)
                              if (repliedMsgElement) {
                                repliedMsgElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                repliedMsgElement.classList.add('bg-primary/20')
                                setTimeout(() => repliedMsgElement.classList.remove('bg-primary/20'), 2000)
                              }
                            }}
                          >
                            {(() => {
                              const repliedMsg = messages.find(m => m.id === message.replyTo)
                              return repliedMsg ? (
                                <>
                                  <p className="font-semibold">{repliedMsg.senderName}</p>
                                  <p className="truncate">{repliedMsg.text}</p>
                                </>
                              ) : <p>Message not found</p>
                            })()}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap break-words">
                          {searchQuery && searchResults.includes(message.id) 
                            ? highlightText(message.text, searchQuery)
                            : message.text
                          }
                        </p>
                        <p
                          className={`text-xs mt-1 ${isOwn && !isDeleted ? 'text-primary-content/70' : 'text-base-content/50'}`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {message.edited && !isDeleted && <span className="ml-1">(edited)</span>}
                          {isOwn &&
                            !isDeleted &&
                            !message.id.startsWith('optimistic-') &&
                            message.seenBy?.includes(otherUserId) && (
                              <span className="ml-2">· Seen</span>
                            )}
                        </p>
                      </div>

                      {/* Mobile: Icon buttons - only show when clicked */}
                      {!message.id.startsWith('optimistic-') &&
                        !isDeleted &&
                        menuMsgId === message.id && (
                          <div className="md:hidden absolute -bottom-7 right-0 flex gap-3 mb-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setReplyingTo(message)
                                setMenuMsgId(null)
                              }}
                              className="hover:opacity-70 transition-opacity"
                            >
                              <svg className="w-4 h-4 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                            </button>
                            {isOwn && (
                              <>
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
                              </>
                            )}
                            {!isOwn && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  showConfirm({
                                    title: 'Hide Message',
                                    message: 'Are you sure you want to hide this message? It will only be hidden for you.',
                                    confirmText: 'Hide',
                                    onConfirm: async () => {
                                      await hideMessage(message.id, user!.uid)
                                      setMessages(prev => prev.filter(m => m.id !== message.id))
                                      setMenuMsgId(null)
                                    }
                                  })
                                }}
                                className="hover:opacity-70 transition-opacity"
                              >
                                <svg className="w-4 h-4 text-base-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              </button>
                            )}
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
          <div className="flex justify-start mb-4">
            <div className="px-5 py-3 md:px-5 md:py-3.5 rounded-lg">
              <div className="flex gap-1.5 md:gap-2">
                <div
                  className="w-1.5 h-1.5 md:w-3 md:h-3 bg-base-content/60 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="w-1.5 h-1.5 md:w-3 md:h-3 bg-base-content/60 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="w-1.5 h-1.5 md:w-3 md:h-3 bg-base-content/60 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-base-100 shrink-0">
        {replyingTo && (
          <div className="px-4 pt-2 pb-1 border-t border-base-300 flex items-center justify-between bg-base-200">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-base-content/70">Replying to {replyingTo.senderName}</p>
              <p className="text-sm text-base-content truncate">{replyingTo.text}</p>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-base-300 rounded-full ml-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="p-4 flex gap-3 items-end">
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
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (user) updateTypingStatus(chatId, user.uid, false)
              handleSendMessage(e as any)
            }
          }}
          placeholder={isFriend ? 'Type a message...' : 'You must be friends to send messages'}
          className="flex-1 bg-base-300 text-base-content px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-w-0 resize-none min-h-[44px] max-h-[120px]"
          disabled={sending || !isFriend}
          rows={1}
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sending || !isFriend}
          className="bg-primary hover:bg-primary/80 active:bg-primary/60 text-primary-content disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-colors shrink-0 h-[44px]"
        >
          Send
        </button>
        </form>
      </div>
    </div>
  )
}
