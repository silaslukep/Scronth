// Firebase configuration
// Replace these with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDummyKeyReplaceWithReal",
    authDomain: "scronth.firebaseapp.com",
    projectId: "scronth",
    storageBucket: "scronth.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Initialize Firebase (will be initialized when script loads)
let db = null;
let firebaseInitialized = false;

// Initialize Firebase when the SDK loads
function initFirebase() {
    if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        firebaseInitialized = true;
        console.log('Firebase initialized');
    }
}

// Check if Firebase is available
function isFirebaseAvailable() {
    return typeof firebase !== 'undefined' && firebaseInitialized && db !== null;
}

