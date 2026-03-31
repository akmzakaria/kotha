# Kotha - Chat Application

A real-time chat application built with Next.js, Firebase Authentication, and MongoDB.

## Features

- User authentication with Google Sign-In (Firebase Auth)
- Real-time messaging interface
- User presence indicators
- Chat history
- Responsive design with Tailwind CSS and DaisyUI

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, DaisyUI
- **Authentication**: Firebase Authentication
- **Database**: MongoDB with Mongoose
- **Deployment**: Ready for Vercel/Netlify

## Setup Instructions

### Prerequisites

- Node.js 18+
- MongoDB (local installation or MongoDB Atlas)
- Firebase project with Authentication enabled

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd kotha
npm install
```

### 2. MongoDB Setup

#### Option A: Local MongoDB

1. Install MongoDB on your system
2. Start MongoDB service
3. The default connection string in `.env.local` is `mongodb://localhost:27017/kotha`

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string from the Atlas dashboard
4. Update `MONGODB_URI` in `.env.local`

### 3. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use existing one
3. Enable Google Authentication in Authentication > Sign-in method
4. Get your Firebase config from Project Settings > General > Your apps
5. Update the Firebase environment variables in `.env.local`

### 4. Environment Variables

Copy `.env.local` and update the following variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/kotha
# Or for MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/kotha
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

### Users Collection

```javascript
{
  uid: String, // Firebase UID
  displayName: String,
  email: String,
  profileImage: String,
  status: "online" | "offline" | "away",
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Chats Collection

```javascript
{
  participants: [String], // Array of user UIDs
  participantNames: Map, // UID -> Display Name mapping
  lastMessage: String,
  lastMessageTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Messages Collection

```javascript
{
  chatId: String, // Reference to Chat _id
  senderId: String, // Firebase UID
  senderName: String,
  text: String,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Routes

- `GET /api/users` - Get all users except current user
- `POST /api/users` - Create/update user profile
- `PATCH /api/users/[userId]` - Update user status
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create or get existing chat between two users
- `GET /api/chats/[chatId]` - Get chat details
- `GET /api/messages` - Get messages for a chat
- `POST /api/messages` - Send a message

## Notes

- Real-time messaging is not fully implemented. Messages are fetched on page load.
- For production real-time features, consider implementing WebSockets (Socket.io) or Server-Sent Events.
- The app uses Firebase Authentication for user management and MongoDB for chat data.

## Deployment

The app is ready to deploy on Vercel, Netlify, or any other platform supporting Next.js.

For Vercel deployment:

1. Connect your repository
2. Add environment variables in Vercel dashboard
3. Deploy

Make sure your MongoDB instance is accessible from your deployment environment.
