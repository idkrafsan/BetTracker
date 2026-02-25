import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// 🔴 REPLACE THIS WITH YOUR ACTUAL FIREBASE CONFIG FROM STEP 3
const firebaseConfig = {
  apiKey: "AIzaSyBJ9jQcWXe0G2OtJCVBGXpA1PWxdUbVQVY",
  authDomain: "bet-tracker-app-447a7.firebaseapp.com",
  projectId: "bet-tracker-app-447a7",
  storageBucket: "bet-tracker-app-447a7.firebasestorage.app",
  messagingSenderId: "963503657480",
  appId: "1:963503657480:web:131129b9b8d0bcea3177bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);