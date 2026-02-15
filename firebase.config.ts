// src/app/firebase.config.ts

import { initializeApp } from "firebase/app";

export const firebaseConfig = {
  apiKey: "AIzaSyCeVJMrX2lV79wYgZwwVuILGfM_Or2giA8",
  authDomain: "marvick-personality-test.firebaseapp.com",
  projectId: "marvick-personality-test",
  storageBucket: "marvick-personality-test.firebasestorage.app",
  messagingSenderId: "1011972341924",
  appId: "1:1011972341924:web:c8fecbfd1509d77e4be631"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
/*
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to Firebase Console: https://console.firebase.google.com/
 * 2. Create a new project (or select existing)
 * 3. Click "Add app" and select "Web" (</> icon)
 * 4. Register your app with a nickname
 * 5. Copy the firebaseConfig object values above
 * 6. Enable Firestore Database:
 *    - Go to Firestore Database in left menu
 *    - Click "Create database"
 *    - Choose "Start in test mode" for now
 *    - Select your preferred location
 * 
 * 7. Security Rules (update in Firestore Rules tab):
 * 
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        // Users collection - allow read/write
 *        match /users/{userId} {
 *          allow read, write: if true;
 *        }
 *        
 *        // Test responses collection
 *        match /test_responses/{responseId} {
 *          allow read, write: if true;
 *        }
 *        
 *        // Results collection
 *        match /results/{resultId} {
 *          allow read, write: if true;
 *        }
 *        
 *        // Questions collection - read only for clients
 *        match /questions/{questionId} {
 *          allow read: if true;
 *          allow write: if false;  // Only update via Firebase Console
 *        }
 *      }
 *    }
 * 
 * NOTE: These are permissive rules for development. 
 * In production, implement proper authentication and access controls.
 */