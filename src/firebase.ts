import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDcrzC5Ln7d43X8HU6MTmXyf-BrVmmSWhQ",
  authDomain: "azul-cfdf9.firebaseapp.com",
  projectId: "azul-cfdf9",
  storageBucket: "azul-cfdf9.firebasestorage.app",
  messagingSenderId: "635336169280",
  appId: "1:635336169280:web:59a0540a097c3dc5720ca5",
  measurementId: "G-D21LQSLVTT"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

export { app, analytics, db };