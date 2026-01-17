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
    try {
        // Check if Firebase config is valid (not dummy values)
        const hasValidConfig = firebaseConfig.apiKey && 
                               firebaseConfig.apiKey !== "AIzaSyDummyKeyReplaceWithReal" &&
                               firebaseConfig.projectId && 
                               firebaseConfig.projectId !== "scronth";
        
        if (typeof firebase !== 'undefined' && firebase.apps.length === 0 && hasValidConfig) {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            firebaseInitialized = true;
            console.log('Firebase initialized successfully');
            return true;
        } else if (!hasValidConfig) {
            console.log('Firebase not configured - using localStorage fallback');
            return false;
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        console.log('Using localStorage fallback');
        return false;
    }
    return false;
}

// Check if Firebase is available
function isFirebaseAvailable() {
    try {
        return typeof firebase !== 'undefined' && 
               firebaseInitialized && 
               db !== null &&
               firebaseConfig.apiKey !== "AIzaSyDummyKeyReplaceWithReal";
    } catch (error) {
        return false;
    }
}

