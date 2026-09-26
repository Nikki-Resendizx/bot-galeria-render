const { db, admin } = require('../firebase');

const botDoc = db.collection('config').doc('bot');

async function getConfig() {
  const a = await botDoc.get();
  const b = await db.collection('config').doc('botones').get();
  const p = await db.collection('config').doc('premium').get();
  return Object.assign(
    {},
    a.exists ? a.data() : {},
    { botones: b.exists ? b.data() : {} },
    { premium: p.exists ? p.data() : { activo: true } }
  );
}

async function saveConfig(data) {
  await botDoc.set(data, { merge: true });
  global.__verifiedmodelsConfigVersion = Date.now();
}

async function getUser() {
  // Los usuarios ya no se persisten en Firebase.
  return null;
}

async function saveUser() {
  // El registro de usuarios vive en Telegram Storage / 👥 USUARIOS.
  return false;
}

async function getUsers() {
  // Telegram Bot API no permite leer el historial del topic como una colección.
  // Por eso el panel no debe fingir que existe una lista de usuarios en Firebase.
  return [];
}

async function setUserStatus() {
  return false;
}

async function getPlantillas() {
  const s = await db.collection('plantillas').get();
  const o = {};
  s.forEach(d => { o[d.id] = Object.assign({ id: d.id }, d.data()); });
  return o;
}

async function savePlantilla(id, data) {
  await db.collection('plantillas').doc(id).set(data, { merge: true });
}

async function deletePlantilla(id) {
  const key = String(id);
  await db.collection('plantillas').doc(key).delete();
  await db.collection('config').doc('storage').collection('plantillas').doc(key).delete().catch(() => {});
}

async function saveModelo(id, data) {
  await db.collection('modelos').doc(String(id)).set(
    Object.assign({}, data, { actualizado: new Date().toISOString() }),
    { merge: true }
  );
  global.__verifiedmodelsConfigVersion = Date.now();
}

async function getModelo(id) {
  const s = await db.collection('modelos').doc(String(id)).get();
  return s.exists ? Object.assign({ id: s.id }, s.data()) : null;
}

async function getModelos() {
  const s = await db.collection('modelos').get();
  return s.docs.map(d => Object.assign({ id: d.id }, d.data()));
}

async function deleteModelo(id) {
  const ref = db.collection('modelos').doc(String(id));
  const votes = await ref.collection('votos').get();
  if (!votes.empty) {
    const batch = db.batch();
    votes.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
  await ref.delete();
  await db.collection('config').doc('storage').collection('modelos').doc(String(id)).delete().catch(() => {});
}

async function resetModeloVotes(id) {
  const modelRef = db.collection('modelos').doc(String(id));
  await db.runTransaction(async tx => {
    const snap = await tx.get(modelRef);
    if (!snap.exists) throw new Error('Modelo no encontrada');
    tx.update(modelRef, { votosBueno: 0, votosMalo: 0, actualizado: new Date().toISOString() });
  });
  const votes = await modelRef.collection('votos').get();
  if (!votes.empty) {
    const batch = db.batch();
    votes.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }
}

async function voteModelo(id, type, voterId) {
  const modelRef = db.collection('modelos').doc(String(id));
  const normalizedType = type === 'bueno' ? 'bueno' : 'malo';
  const voterKey = String(voterId || '').trim();
  if (!voterKey) throw new Error('No se pudo identificar al usuario');

  return db.runTransaction(async tx => {
    const snap = await tx.get(modelRef);
    if (!snap.exists) throw new Error('Modelo no encontrada');
    const voteRef = modelRef.collection('votos').doc(voterKey);
    const previous = await tx.get(voteRef);
    if (previous.exists) return { registered:false, type:previous.get('type')||null, bueno:Number(snap.get('votosBueno')||0), malo:Number(snap.get('votosMalo')||0), count:Number(snap.get(normalizedType==='bueno'?'votosBueno':'votosMalo')||0) };

    const field = normalizedType === 'bueno' ? 'votosBueno' : 'votosMalo';
    const bueno = Number(snap.get('votosBueno') || 0) + (field === 'votosBueno' ? 1 : 0);
    const malo = Number(snap.get('votosMalo') || 0) + (field === 'votosMalo' ? 1 : 0);
    tx.update(modelRef, { votosBueno:bueno, votosMalo:malo, actualizado:new Date().toISOString() });
    tx.set(voteRef, { type:normalizedType, creado:new Date().toISOString() });
    return { registered:true, type:normalizedType, bueno, malo, count:normalizedType==='bueno'?bueno:malo };
  });
}

async function getBotMedia() {
  const storage = await getStorage();
  const media = storage.media || {};
  const bot = await botDoc.get();
  const data = bot.exists ? (bot.data() || {}) : {};

  return {
    ...media,
    bienvenida: media.bienvenida?.file_id || media.bienvenida || data.bienvenida_media || '',
    galeria: media.galeria?.file_id || media.galeria || data.galeria_media || ''
  };
}

async function getButtonConfig() {
  const s = await db.collection('config').doc('botones').get();
  return s.exists ? (s.data() || {}) : {};
}

async function saveButtonConfig(key, data) {
  const rawKey = String(key);
  const ref = db.collection('config').doc('botones');
  if (rawKey.includes('.')) {
    const [section, buttonKey] = rawKey.split('.', 2);
    const snap = await ref.get();
    const current = snap.exists ? (snap.data() || {}) : {};
    const sectionData = current[section] && typeof current[section] === 'object' ? current[section] : {};
    await ref.set({
      [section]: {
        ...sectionData,
        [buttonKey]: Object.assign({}, data, { actualizado: new Date().toISOString() })
      }
    }, { merge: true });
    global.__verifiedmodelsConfigVersion = Date.now();
    return;
  }
  await ref.set({
    [rawKey]: Object.assign({}, data, { actualizado: new Date().toISOString() })
  }, { merge: true });
  global.__verifiedmodelsConfigVersion = Date.now();
}

async function deleteBotMedia(key) {
  const normalizedKey = String(key);
  await deleteStorageIndex(normalizedKey);
}
async function deleteModelBotMedia(modelId) {
  const key = 'modelo_' + String(modelId);
  const storage = await getStorage();
  const previous = storage.media?.[key] || null;
  await deleteStorageIndex(key);
  return previous;
}
async function saveBotMedia(key, fileId) {
  const normalizedKey = String(key);
  const value = String(fileId || '').trim();
  if (!value) throw new Error('Falta file_id');
  await saveStorageIndex(normalizedKey, { file_id: value });
}

async function saveTemplateMedia(id, fileId) {
  await saveStorageIndex('plantilla_' + String(id), {
    template_id: String(id),
    file_id: String(fileId || '')
  });
}

async function getStorage() {
  const s = await db.collection('config').doc('storage').get();
  return s.exists ? (s.data() || {}) : {};
}

async function saveStorageIndex(key, data) {
  await db.collection('config').doc('storage').set({
    media: {
      [String(key)]: Object.assign({}, data, { actualizado: new Date().toISOString() })
    }
  }, { merge: true });
}

async function deleteStorageIndex(key) {
  const ref = db.collection('config').doc('storage');
  await ref.set({
    media: { [String(key)]: admin.firestore.FieldValue.delete() }
  }, { merge: true });
}

async function saveModelBotMedia(modelId, data) {
  await saveStorageIndex('modelo_' + String(modelId), Object.assign({}, data, {
    model_id: String(modelId)
  }));
}

async function getModelBotMedia(modelId) {
  const storage = await getStorage();
  const indexed = storage.media?.['modelo_' + String(modelId)];
  if (indexed) return indexed;
  return null;
}

module.exports = {
  db,
  getConfig, saveConfig,
  getUser, saveUser, getUsers, setUserStatus,
  getPlantillas, savePlantilla, deletePlantilla,
  getModelo, getModelos, saveModelo, deleteModelo, resetModeloVotes, voteModelo,
  getBotMedia, saveBotMedia,
  getButtonConfig, saveButtonConfig,
  saveTemplateMedia,
  getStorage, saveStorageIndex, deleteStorageIndex,
  saveModelBotMedia, getModelBotMedia, deleteModelBotMedia
};