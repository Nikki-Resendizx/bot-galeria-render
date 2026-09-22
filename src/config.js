require('dotenv').config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_IDS_ENV = (process.env.ADMIN_IDS || process.env.ADMINS || "8719034760").split(',').map(s=>s.trim()).filter(Boolean);

const WEBAPP_URL = process.env.WEBAPP_URL || "https://tu-webapp.com";
const CANAL_OFICIAL = process.env.CANAL_OFICIAL || "https://t.me/tu_canal";

const DEFAULT_BOTONES = {
  bienvenida: {
    galeria_virtual: { text: "💖 VER GALERÍA VIRTUAL 💖", style: "primary" },
    lista_modelos: { text: "👑 VER LISTA DE MODELOS 👑", style: "danger" },
    canal_oficial: { text: "💎 CANAL OFICIAL 💎", style: "success" }
  }
};

module.exports = { BOT_TOKEN, ADMIN_IDS_ENV, WEBAPP_URL, CANAL_OFICIAL, DEFAULT_BOTONES };
