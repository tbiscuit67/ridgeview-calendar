// firebase-config.js
// Single Firebase initialization shared by index.html and admin.html.
// Previously this same config block was copy-pasted into both pages —
// keeping one copy means there's only one place to update if the
// project's Firebase settings ever change.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";

// Note: this is a *client-side* Firebase config. It's normal and safe
// for it to be public/visible in the page source — Firebase access
// control is enforced server-side via Firestore Security Rules, not by
// hiding this object. If you haven't already, double check in the
// Firebase console that your Firestore rules only allow writes to the
// "meetings" collection from signed-in editors.
const firebaseConfig = {
  apiKey: "AIzaSyA3TUDLJsxYUUkYSHnfozd634fU3A0Ljl4",
  authDomain: "ridgeview-alum-mtg-calendar.firebaseapp.com",
  projectId: "ridgeview-alum-mtg-calendar",
  storageBucket: "ridgeview-alum-mtg-calendar.firebasestorage.app",
  messagingSenderId: "174039119201",
  appId: "1:174039119201:web:c1d19ea251339c16654120",
  measurementId: "G-RT9GBNC5J9"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
