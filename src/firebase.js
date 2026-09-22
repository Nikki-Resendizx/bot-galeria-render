const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "galeria-verifiedmodels.firebaseapp.com",
  projectId: "galeria-verifiedmodels",
  storageBucket: "galeria-verifiedmodels.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
const app = initializeApp(firebaseConfig);
module.exports = { db: getFirestore(app) };
