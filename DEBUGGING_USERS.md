# Troubleshooting: Users Not Showing

If users are not showing in the Users section, follow these debugging steps:

## Step 1: Check Browser Console

1. Open DevTools in your browser (F12 or Right-click > Inspect)
2. Go to the **Console** tab
3. Navigate to the Users section in the app
4. Look for logs that say:
   - `getAllUsers called with currentUserId: [your-uid]`
   - `Query snapshot size: [number]`
   - `All documents: [...]`
   - `Filtered users: [...]`

These logs will tell you if Firebase is returning data.

## Step 2: Verify Users Are Created in Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Firestore Database**
3. Look for a `users` collection
4. Check if there are documents inside (each document should have a User ID as its key)
5. Each document should have fields like:
   - `displayName` (string)
   - `email` (string)
   - `profileImage` (string)
   - `status` (string: "online", "offline", "away")
   - `lastSeen` (timestamp)

## Step 3: Check Firestore Security Rules

1. In Firebase Console → **Firestore Database** → **Rules** tab
2. Verify the rules allow reading the `users` collection:

```javascript
match /users/{uid} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == uid;
}
```

## Step 4: Manually Create Test Users (For Testing)

If no users are in Firestore, you can manually create them:

1. Go to Firestore Database
2. Click "Start collection" → name it `users`
3. Click "Auto ID" to create a document
4. Add these fields:
   ```
   displayName: "Test User 1" (string)
   email: "test1@example.com" (string)
   profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Test User 1" (string)
   status: "online" (string)
   lastSeen: [current timestamp] (timestamp)
   ```
5. Create at least 2 test users with different names

## Step 5: Verify User Profile Creation on Sign In

When you sign in with Google:

1. The app should automatically create a user profile in Firestore
2. Check the Firestore Database after signing in
3. You should see a new document in the `users` collection with your Google account details

If this doesn't happen, check the browser console for errors in the `createOrUpdateUserProfile` function.

## Step 6: Check Network Requests

1. In DevTools, go to the **Network** tab
2. Filter by "fetch" or "XHR"
3. Look for requests to your Firestore database
4. Check if they're returning data (Status 200) or errors

## Common Issues & Solutions

### Issue: `Query snapshot size: 0`

**Cause:** The `users` collection is empty or doesn't exist
**Solution:** Create test users manually (see Step 4 above)

### Issue: "Permission denied" error in console

**Cause:** Firestore security rules don't allow the read operation
**Solution:** Update your security rules to allow reading (see Step 3)

### Issue: "User profile not created" after sign in

**Cause:** The `createOrUpdateUserProfile` function failed
**Solution:** Check for errors in the browser console under the "Console" tab

### Issue: Users show but status is undefined

**Cause:** The `status` field might be missing from user documents
**Solution:** Add a `status` field to each user document in Firestore

## Next Steps

1. Check the console logs to see if Firestore is returning data
2. If `Query snapshot size: 0`, create test users in Firestore
3. If there are permission errors, verify your security rules
4. Click the **Refresh** button in the Users section to re-fetch data
