const { initializeApp, getApps } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
if(!getApps().length){
  initializeApp({ apiKey:"AIzaSyAIHevrpglvhHK3IsxpnkHlWpxnuf5o1So",authDomain:"galeria-verifiedmodels.firebaseapp.com",projectId:"galeria-verifiedmodels",storageBucket:"galeria-verifiedmodels.firebasestorage.app",messagingSenderId:"684551560793",appId:"1:684551560793:web:3730a07d8d6ec737e3db48"});
}
module.exports = { db: getFirestore() };
