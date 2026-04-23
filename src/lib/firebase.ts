import { getApp, getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDPQMTVi3YHYI5TEEfMIoGGIZkgILRM7bk",
  authDomain: "pregnancy-belt-fb490.firebaseapp.com",
  databaseURL: "https://pregnancy-belt-fb490-default-rtdb.firebaseio.com",
  projectId: "pregnancy-belt-fb490",
  storageBucket: "pregnancy-belt-fb490.firebasestorage.app",
  messagingSenderId: "621588747978",
  appId: "1:621588747978:web:ffe72b0614bdeb82aa0633",
  measurementId: "G-8PLZE53MH4",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };
