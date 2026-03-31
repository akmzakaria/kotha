# Firebase Configuration

To set up Firebase for your Kotha chat application:

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and create a new project
3. Once created, go to Project Settings (gear icon)

## 2. Set Up Google Authentication

1. In Firebase Console, go to **Authentication** tab
2. Click "Get Started"
3. Select **Google** as a sign-in method
4. Enable it and save

## 3. Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database** tab
2. Click "Create Database"
3. Choose **Start in test mode** (for development)
4. Select a region close to your location

## 4. Create Collections

In Firestore, create these collections:

- **users** - Stores user profiles
  - Document ID: User's UID
  - Fields:
    - displayName (string)
    - profileImage (string)
    - email (string)
    - lastSeen (timestamp)
    - status (string)

- **chats** - Stores chat conversations
  - Document ID: Auto-generated
  - Fields:
    - participants (array of user IDs)
    - createdAt (timestamp)
    - lastMessage (string)
    - lastMessageTime (timestamp)

- **messages** - Stores individual messages
  - Document ID: Auto-generated
  - Fields:
    - chatId (string)
    - senderId (string)
    - text (string)
    - timestamp (timestamp)

## 5. Set Firestore Security Rules

Go to **Firestore Database** > **Rules** and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }

    match /chats/{chatId} {
      allow read: if request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      allow update: if request.auth.uid in resource.data.participants;
    }

    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

## 6. Add Environment Variables

Create a `.env.local` file in your project root:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

You can find these values in Firebase Console > Project Settings (gear icon) > Your apps
