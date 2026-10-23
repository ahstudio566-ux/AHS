import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;

// Only initialize if API key is present to avoid crash
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key_here') {
  try {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase API Key is missing. Authentication features will be disabled.");
}

export const auth = authInstance as Auth;
export const isFirebaseConfigured = !!authInstance;
