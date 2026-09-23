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

async function getUser(id) {
  const s = await db.collection('usuarios').doc(String(id)).get();
  return s.exists ? Object.assign({ id: s.id }, s.data()) : null;
}

async function saveUser(id, info) {
  await db.collection('usuarios').doc(String(id)).set(
    Object.assign({}, info, { id: String(id), actualizado: admin.firestore.FieldValue.serverTimestamp() }),
    { merge: true }
  );
}

async function getUsers() {
  const s = await db.collection('usuarios').get();
  return s.docs.map(d => Object.assign({ id: d.id }, d.data()));
}

async function setUserStatus(id, data) {
  await db.collection('usuarios').doc(String(id)).set(data, { merge: true });
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
  await db.collection('modelos').doc(String(id)).delete();
  await db.collection('config').doc('storage').collection('modelos').doc(String(id)).delete().catch(() => {});
}

async function resetModeloVotes(id) {
  await db.collection('modelos').doc(String(id)).set({ votosBueno: 0, votosMalo: 0 }, { merge: true });
}

async function voteModelo(id, type) {
  const ref = db.collection('modelos').doc(String(id));
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('Modelo no encontrada');
    const field = type === 'bueno' ? 'votosBueno' : 'votosMalo';
    const current = Number(snap.get(field) || 0);
    tx.update(ref, { [field]: current + 1 });
    return current + 1;
  });
}

async function getBotMedia() {
  const s = await botDoc.get();
  if (!s.exists) return {};

  const data = s.data() || {};
  const media = data.media || {};

  return {
    ...media,
    bienvenida:
      media.bienvenida ||
      data.bienvenida_media ||
      data.bienvenida_media_file_id ||
      data.bienvenida_media_url ||
      '',
    galeria:
      media.galeria ||
      data.galeria_media ||
      data.galeria_media_file_id ||
      data.galeria_media_url ||
      ''
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
  const payload = { media: { [normalizedKey]: admin.firestore.FieldValue.delete() } };
  if (normalizedKey === 'bienvenida') {
    payload.bienvenida_media = admin.firestore.FieldValue.delete();
    payload.bienvenida_media_file_id = admin.firestore.FieldValue.delete();
    payload.bienvenida_media_url = admin.firestore.FieldValue.delete();
  }
  if (normalizedKey === 'galeria') {
    payload.galeria_media = admin.firestore.FieldValue.delete();
    payload.galeria_media_file_id = admin.firestore.FieldValue.delete();
    payload.galeria_media_url = admin.firestore.FieldValue.delete();
  }
  await botDoc.set(payload, { merge: true });
}
async function deleteModelBotMedia(modelId) {
  await db.collection('config').doc('storage').collection('modelos').doc(String(modelId)).delete();
}
async function saveBotMedia(key, fileId) {
  const normalizedKey = String(key);
  const value = String(fileId);

  const payload = {
    media: { [normalizedKey]: value }
  };

  if (normalizedKey === 'bienvenida') {
    payload.bienvenida_media = value;
    payload.bienvenida_media_file_id = value;
    payload.bienvenida_media_url = value;
  }

  if (normalizedKey === 'galeria') {
    payload.galeria_media = value;
    payload.galeria_media_file_id = value;
    payload.galeria_media_url = value;
  }

  await botDoc.set(payload, { merge: true });
}

async function saveTemplateMedia(id, fileId) {
  await db.collection('plantillas').doc(String(id)).set(
    { media_file_id: fileId, actualizado: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
}

async function getStorage() {
  const s = await db.collection('config').doc('storage').get();
  return s.exists ? (s.data() || {}) : {};
}

async function saveStorageIndex(key, data) {
  await db.collection('config').doc('storage').set({
    media: { [key]: Object.assign({}, data, { actualizado: new Date().toISOString() }) }
  }, { merge: true });
}

async function saveModelBotMedia(modelId, data) {
  await db.collection('config').doc('storage').collection('modelos').doc(String(modelId))
    .set(Object.assign({}, data, { actualizado: new Date().toISOString() }), { merge: true });
}

async function getModelBotMedia(modelId) {
  const s = await db.collection('config').doc('storage').collection('modelos').doc(String(modelId)).get();
  return s.exists ? s.data() : null;
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
  getStorage, saveStorageIndex,
  saveModelBotMedia, getModelBotMedia, deleteModelBotMedia
};