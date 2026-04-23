import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyDPQMTVi3YHYI5TEEfMIoGGIZkgILRM7bk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "pregnancy-belt-fb490.firebaseapp.com",
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ?? "https://pregnancy-belt-fb490-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "pregnancy-belt-fb490",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "pregnancy-belt-fb490.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "621588747978",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:621588747978:web:ffe72b0614bdeb82aa0633",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-8PLZE53MH4",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };
