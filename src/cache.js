const { doc, getDoc, setDoc } = require('firebase/firestore');
const { db } = require('./firebase');

let memoria = {
  botones: null,
  premium: null,
  modelos: null
};

async function getConfig() {
  try {
    // 1. Botones
    if (!memoria.botones) {
      const snap = await getDoc(doc(db, "config", "botones"));
      memoria.botones = snap.exists()? snap.data() : null;
    }
    // 2. Premium status global
    if (!memoria.premium) {
      const snap2 = await getDoc(doc(db, "config", "premium"));
      memoria.premium = snap2.exists()? snap2.data() : { activo: false };
    }
    return memoria;
  } catch (e) {
    console.log("Error getConfig:", e.message);
    return memoria;
  }
}

async function saveConfig(tipo, data) {
  await setDoc(doc(db, "config", tipo), data, { merge: true });
  memoria[tipo] = data;
  return true;
}

function clearCache() {
  memoria = { botones: null, premium: null, modelos: null };
}

module.exports = { getConfig, saveConfig, clearCache };
