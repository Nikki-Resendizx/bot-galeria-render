const { doc, getDoc, setDoc } = require('firebase/firestore');
const { db } = require('./firebase');

let memoria = null;
let ultimoFetch = 0;
const CACHE_TTL = 1000 * 60 * 2; // 2 minutos

async function getConfig() {
  const ahora = Date.now();
  if (memoria && (ahora - ultimoFetch) < CACHE_TTL) {
    return memoria;
  }

  try {
    // 1. Config principal (bienvenida, galeria, admins)
    const snapBot = await getDoc(doc(db, "config", "bot")).catch(()=>({ exists:()=>false }));
    const dataBot = snapBot.exists() ? snapBot.data() : {};

    // 2. Botones
    const snapBotones = await getDoc(doc(db, "config", "botones")).catch(()=>({ exists:()=>false }));
    const dataBotones = snapBotones.exists() ? snapBotones.data() : {};

    // 3. Premium
    const snapPremium = await getDoc(doc(db, "config", "premium")).catch(()=>({ exists:()=>false }));
    const dataPremium = snapPremium.exists() ? snapPremium.data() : { activo: false };

    memoria = {
      // Defaults de bot
      bienvenida_texto: dataBot.bienvenida_texto || "Hola {nombre} 💖 bienvenido",
      bienvenida_media: dataBot.bienvenida_media || null,
      galeria_texto: dataBot.galeria_texto || "🖼️ Galería Virtual",
      galeria_media: dataBot.galeria_media || null,
      plantilla_texto: dataBot.plantilla_texto || "{perfil} @{username} {edad}",
      admins: dataBot.admins || ["8719034760"],
      canal: dataBot.canal || process.env.CANAL_OFICIAL || null,
      webapp: dataBot.webapp || process.env.WEBAPP_URL || null,
      
      // Estructurados
      botones: dataBotones,
      premium: dataPremium,
      
      // Raw para compatibilidad
      ...dataBot
    };

    ultimoFetch = ahora;
    return memoria;

  } catch (e) {
    console.log("Error getConfig:", e.message);
    // Devuelve memoria anterior o defaults para no romper bot
    if (memoria) return memoria;
    return {
      bienvenida_texto: "Hola {nombre} 💖",
      bienvenida_media: null,
      galeria_texto: "Galería",
      admins: ["8719034760"],
      botones: {},
      premium: { activo: false }
    };
  }
}

async function saveConfig(tipo, data) {
  try {
    await setDoc(doc(db, "config", tipo), data, { merge: true });
    // Invalidamos cache
    memoria = null;
    ultimoFetch = 0;
    return true;
  } catch(e) {
    console.log("saveConfig error:", e.message);
    return false;
  }
}

function clearCache() {
  memoria = null;
  ultimoFetch = 0;
}

module.exports = { getConfig, saveConfig, clearCache };
