// firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAp4Xmd1Dhz1t67VzLeTLuRpKHsf9_5VSw",
  authDomain: "ai-prompt-helper-8f533.firebaseapp.com",
  projectId: "ai-prompt-helper-8f533",
  storageBucket: "ai-prompt-helper-8f533.appspot.com",
  messagingSenderId: "780032632364",
  appId: "1:780032632364:web:a16d89f587fba255efd389",
  measurementId: "G-36TMTWY3Q7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth and Firestore
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, signInWithPopup, signOut, db };
