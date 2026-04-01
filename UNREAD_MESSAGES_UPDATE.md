# Kotha Chat App - Unread Messages & Notifications Update

## Changes Implemented (April 1, 2026 - 14:55)

### ✅ Unread Message Count Badges
- **Added to Navigation (Desktop & Mobile)**:
  - Red badge on Chats button showing total unread messages
  - Red badge on Requests button showing friend request count
  - Displays count up to 99, shows "99+" for higher numbers
  - Positioned at top-right corner of buttons
  - Real-time updates every 3 seconds

### ✅ Message Highlighting in Chats List
- **Visual Indicators**:
  - Chats with unread messages have light primary color background
  - Unread count badge displayed next to timestamp
  - Bold font for chat name and last message when unread
  - Highlight automatically removed when chat is opened

### ✅ Auto-Read Functionality
- Messages marked as read when:
  - User opens a chat
  - User is viewing the chat (polls every 2 seconds)
- Unread count resets to 0 for that chat
- Other users' chats remain highlighted until they view them

## Technical Implementation

### Database Changes:
1. **Chat Model** (`lib/models/Chat.ts`):
   - Added `unreadCount` field: `{ userId: count }`
   - Tracks unread messages per user

### API Updates:
1. **Messages API** (`app/api/messages/route.ts`):
   - Increments unread count for receiver when message is sent
   - Updates `unreadCount.{receiverId}` in chat document

2. **Chat API** (`app/api/chats/[chatId]/route.ts`):
   - Added PATCH endpoint with `mark_read` action
   - Resets unread count to 0 for specific user

### Frontend Changes:
1. **chatService.ts**:
   - Added `markChatAsRead()` function
   - Updated `ChatRoom` interface with `unreadCount` field

2. **Navigation.tsx**:
   - Polls for unread counts every 3 seconds
   - Displays badges on both desktop and mobile
   - Shows total unread messages across all chats
   - Shows friend request count

3. **ChatsList.tsx**:
   - Highlights chats with unread messages
   - Shows unread count badge per chat
   - Bold text for unread chats

4. **Chat Page** (`app/chat/[chatId]/page.tsx`):
   - Marks chat as read on open
   - Marks as read on each message poll (2s interval)

## User Experience:
- 🔴 **Red badges** show exact counts at top-right of navigation buttons
- 🎨 **Highlighted chats** make unread messages easy to spot
- ✅ **Auto-read** when viewing chat - no manual action needed
- 📊 **Real-time updates** - counts update automatically
- 📱 **Works on mobile and desktop** - consistent experience

## Files Modified:
1. `/lib/models/Chat.ts` - Added unreadCount field
2. `/lib/chatService.ts` - Added markChatAsRead function
3. `/app/api/messages/route.ts` - Increment unread on send
4. `/app/api/chats/[chatId]/route.ts` - Mark as read endpoint
5. `/app/chat/[chatId]/page.tsx` - Auto-mark as read
6. `/components/ChatsList.tsx` - Highlight & badge display
7. `/components/Navigation.tsx` - Badge counters on nav buttons
