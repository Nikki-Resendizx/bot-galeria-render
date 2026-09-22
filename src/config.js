require('dotenv').config();
module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  WEBAPP_URL: process.env.WEBAPP_URL || 'https://tu-webapp.com',
  CANAL_OFICIAL: process.env.CANAL_OFICIAL || 'https://t.me/tu_canal',
  ADMIN_IDS_ENV: (process.env.ADMIN_IDS || '8719034760').split(',').map(s=>s.trim()).filter(Boolean),
  FIREBASE: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  }
};
