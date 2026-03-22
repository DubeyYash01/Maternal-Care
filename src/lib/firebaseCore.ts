import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getApp } from "firebase/app";

// TODO: replace this with your actual config from Firebase console
const firebaseConfig = {
  apiKey: "REDACTED",
  authDomain: "pregnancy-belt-fb490.firebaseapp.com",
  projectId: "pregnancy-belt-fb490",
  storageBucket: "pregnancy-belt-fb490.firebasestorage.app",
  messagingSenderId: "621588747978",
  appId: "1:621588747978:web:ffe72b0614bdeb82aa0633",
  measurementId: "G-8PLZE53MH4"
};

const app = initializeApp(firebaseConfig);
console.log("[DEBUG] app options", getApp().options);
export const db = getFirestore(app);