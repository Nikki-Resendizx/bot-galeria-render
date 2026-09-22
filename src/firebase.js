const { initializeApp, getApps, getApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { FIREBASE } = require('./config');
let app = getApps().length ? getApp() : initializeApp(FIREBASE);
const db = getFirestore(app);
console.log("🔥 Firebase V16");
module.exports = { db, app };
