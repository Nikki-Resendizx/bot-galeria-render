const express = require('express');
const { Telegraf } = require('telegraf');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy, increment, updateDoc, deleteDoc } = require('firebase/firestore');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://galeria-verifiedmodels.pages.dev";
const ADMIN_IDS_ENV = (process.env.ADMIN_IDS || "").split(",").map(s=>s.trim()).filter(Boolean);

if (!getApps().length) {
  initializeApp({ apiKey:"AIzaSyAIHevrpglvhHK3IsxpnkHlWpxnuf5o1So",authDomain:"galeria-verifiedmodels.firebaseapp.com",projectId:"galeria-verifiedmodels"});
}
const db=getFirestore();
const bot = new Telegraf(BOT_TOKEN);

// --- PEGA AQUÍ TODO EL CÓDIGO QUE TE PASÉ ANTES DESDE getConfig() HASTA LOS bot.action ---
// (el último bot.js que te di que ya jala bienvenida/galeria/plantillas/usuarios/admins)
// --- SOLO CAMBIA LA ULTIMA PARTE POR ESTO DE ABAJO ---

const app = express();
app.use(express.json());
app.get('/', (req,res)=> res.send('Bot OK en Render 24/7'));
app.post(`/webhook`, (req,res)=>{ bot.handleUpdate(req.body,res); });
app.listen(process.env.PORT || 3000, async()=>{
  console.log('Bot iniciado en Render');
  // Activa webhook automático
  const url = process.env.RENDER_EXTERNAL_URL;
  if(url){ await bot.telegram.setWebhook(`${url}/webhook`); console.log('Webhook:', `${url}/webhook`); }
});
