const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Config - usa ENV para que no se filtre
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "galeria-verifiedmodels.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "galeria-verifiedmodels",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "galeria-verifiedmodels.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

module.exports = { db };