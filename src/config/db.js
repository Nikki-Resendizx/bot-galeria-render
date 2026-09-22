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
}

async function saveUser(id, info) {
  await db.collection('usuarios').doc(String(id)).set(
    Object.assign({}, info, {
      id: String(id),
      actualizado: admin.firestore.FieldValue.serverTimestamp()
    }),
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
  s.forEach(d => {
    o[d.id] = Object.assign({ id: d.id }, d.data());
  });
  return o;
}

async function savePlantilla(id, data) {
  await db.collection('plantillas').doc(id).set(data, { merge: true });
}

async function deletePlantilla(id) {
  await db.collection('plantillas').doc(id).delete();
}

async function getModelo(id) {
  const s = await db.collection('modelos').doc(String(id)).get();
  return s.exists ? Object.assign({ id: s.id }, s.data()) : null;
}

async function getModelos() {
  const s = await db.collection('modelos').get();
  return s.docs.map(d => Object.assign({ id: d.id }, d.data()));
}

async function getBotMedia() {
  const s = await botDoc.get();
  return s.exists ? ((s.data() || {}).media || {}) : {};
}

async function getButtonConfig() {
  const s = await db.collection('config').doc('botones').get();
  return s.exists ? (s.data() || {}) : {};
}

async function saveButtonConfig(key, data) {
  await db.collection('config').doc('botones').set({
    [String(key)]: Object.assign({}, data, { actualizado: new Date().toISOString() })
  }, { merge: true });
}

async function saveBotMedia(key, fileId) {
  await botDoc.set({ media: { [key]: fileId } }, { merge: true });
}

async function saveTemplateMedia(id, fileId) {
  await db.collection('plantillas').doc(String(id)).set(
    {
      media_file_id: fileId,
      actualizado: admin.firestore.FieldValue.serverTimestamp()
    },
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
  getConfig,
  saveConfig,
  saveUser,
  getUsers,
  setUserStatus,
  getPlantillas,
  savePlantilla,
  deletePlantilla,
  getModelo,
  getModelos,
  getBotMedia,
  saveBotMedia,
  getButtonConfig,
  saveButtonConfig,
  saveTemplateMedia,
  getStorage,
  saveStorageIndex,
  saveModelBotMedia,
  getModelBotMedia
};
