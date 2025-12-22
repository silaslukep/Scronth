# QUICK FIREBASE SETUP - 5 MINUTES TO MAKE POSTS PUBLIC

## Step 1: Create Firebase Project (2 minutes)
1. Go to https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Name it "scronth" (or anything you want)
4. Click Continue, then Create project
5. Wait for it to finish (30 seconds)

## Step 2: Enable Firestore (1 minute)
1. In Firebase Console, click "Firestore Database" in the left menu
2. Click "Create database"
3. Select "Start in test mode" (we'll secure it later)
4. Click Next
5. Choose a location (pick the closest to you)
6. Click Enable

## Step 3: Get Your Config (1 minute)
1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>` (or "Add app" then select web)
5. Register app name: "scronth-web"
6. Click "Register app"
7. Copy the config object (it looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Step 4: Update firebase-config.js (30 seconds)
1. Open `firebase-config.js` in your project
2. Replace the dummy values with your REAL config from Step 3
3. Save the file

## Step 5: Update index.html (30 seconds)
1. Open `index.html`
2. Uncomment the Firebase script tags (remove the `<!--` and `-->`)
3. Save the file

## Step 6: Set Firestore Rules (30 seconds)
1. In Firebase Console, go to Firestore Database
2. Click "Rules" tab
3. Replace the rules with this:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Click "Publish"

## DONE! 
Refresh your website - posts will now be PUBLIC and visible to ALL users across ALL devices!

**Note:** Firebase free tier gives you 50,000 reads/day and 20,000 writes/day - more than enough for a social media site!

