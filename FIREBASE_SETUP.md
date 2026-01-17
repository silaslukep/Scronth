# Firebase Setup Instructions

To make posts persistent and visible to ALL users across all devices, you need to set up Firebase Firestore.

## Steps:

1. **Create a Firebase Project:**
   - Go to https://console.firebase.google.com/
   - Click "Add project" or select an existing project
   - Follow the setup wizard

2. **Enable Firestore:**
   - In your Firebase project, go to "Firestore Database"
   - Click "Create database"
   - Start in "test mode" (we'll add security rules later)
   - Choose a location for your database

3. **Get Your Firebase Config:**
   - In Firebase Console, go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (`</>`) to add a web app
   - Register your app and copy the config object

4. **Update firebase-config.js:**
   - Open `firebase-config.js`
   - Replace the placeholder values with your actual Firebase config:
   
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

5. **Set Firestore Security Rules (Important!):**
   - In Firebase Console, go to Firestore Database > Rules
   - Replace the rules with:
   
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Posts are publicly readable, but only authenticated users can write
       match /posts/{postId} {
         allow read: if true;  // Anyone can read posts
         allow write: if request.auth != null;  // Only logged-in users can write
       }
       
       // Profiles are publicly readable, but only the user or admins can write
       match /profiles/{userId} {
         allow read: if true;  // Anyone can read profiles
         allow write: if request.auth != null && (request.auth.uid == userId || isAdmin(request.auth.uid));
       }
     }
   }
   ```

   **Note:** For now, since we're using localStorage for auth, you can use these simpler rules:
   
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;  // Public read/write for now
       }
     }
   }
   ```

6. **Test It:**
   - Open your website
   - Create a post
   - Check Firebase Console > Firestore Database to see your post appear
   - Open the site in a different browser/device - you should see the post!

## How It Works:

- **Before:** Posts were stored in `localStorage`, which is browser-specific. Each user only saw their own posts.
- **After:** Posts are stored in Firebase Firestore (cloud database), which is shared across ALL users and devices. When one user posts, everyone can see it immediately!

## Fallback:

If Firebase is not configured or unavailable, the app will automatically fall back to `localStorage` so it still works, but posts won't be shared across users.

