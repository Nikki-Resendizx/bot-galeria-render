require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  WEBAPP_URL: process.env.WEBAPP_URL || "https://galeria-verifiedmodels.pages.dev",
  CANAL_OFICIAL: process.env.CANAL_OFICIAL || "https://t.me/VerifiedModels_VIP",
  
  // Admins desde ENV separados por coma: 123,456,789
  ADMIN_IDS_ENV: (process.env.ADMIN_IDS || "").split(",").map(s => s.trim()).filter(Boolean),
  
  // Valores por defecto si no hay nada en Firebase
  DEFAULT_BOTONES: {
    bienvenida: {
      galeria_virtual: { text: "💖 VER GALERÍA VIRTUAL 💖", style: "primary" },
      lista_modelos: { text: "👑 VER LISTA DE MODELOS 👑", style: "danger" },
      canal_oficial: { text: "💎 CANAL OFICIAL 💎", style: "success" }
    }
  }
};
