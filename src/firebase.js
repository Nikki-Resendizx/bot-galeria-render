// src/firebase.js - v14 FIX
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAIHevrpglvhHK3IsxpnkHlWpxnuf5o1So",
  authDomain: "galeria-verifiedmodels.firebaseapp.com",
  projectId: "galeria-verifiedmodels",
  storageBucket: "galeria-verifiedmodels.firebasestorage.app",
  messagingSenderId: "684551560793",
  appId: "1:684551560793:web:3730a07d8d6ec737e3db48",
  measurementId: "G-YZZ0XWHLXM"
};

// Evitar reinicializar en hot reload de Render
const app = getApps().length === 0? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

function getFirestoreInstance() {
  return db;
}

module.exports = { db, getFirestore: getFirestoreInstance, app };
