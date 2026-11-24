const { db } = require('./firebase');

const BACKUP_FORMAT = 'verifiedmodels-models-backup';
const BACKUP_VERSION = 1;

function serialize(value) {
  if (value === null || value === undefined) return value;
  if (value && typeof value.toDate === 'function' && Number.isFinite(value.seconds)) {
    return {
      __firestore_type: 'timestamp',
      seconds: value.seconds,
      nanoseconds: value.nanoseconds || 0
    };
  }
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = serialize(item);
    return out;
  }
  return value;
}

async function exportModelsBackup() {
  const snapshot = await db.collection('modelos').get();
  const models = [];

  for (const modelDoc of snapshot.docs) {
    const [votesSnapshot, commentsSnapshot] = await Promise.all([
      modelDoc.ref.collection('votos').get(),
      modelDoc.ref.collection('comentarios').get()
    ]);

    models.push({
      id: modelDoc.id,
      data: serialize(modelDoc.data() || {}),
      votos: votesSnapshot.docs.map(doc => ({ id: doc.id, data: serialize(doc.data() || {}) })),
      comentarios: commentsSnapshot.docs.map(doc => ({ id: doc.id, data: serialize(doc.data() || {}) }))
    });
  }

  const storageSnapshot = await db.collection('config').doc('storage').get();
  const storage = storageSnapshot.exists ? (storageSnapshot.data() || {}) : {};
  const modelMedia = {};
  for (const [key, value] of Object.entries(storage.media || {})) {
    if (key.startsWith('modelo_')) modelMedia[key] = serialize(value);
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    source: 'Galeria VerifiedModels WebApp / Firestore',
    collection: 'modelos',
    totalModels: models.length,
    models,
    modelMedia
  };
}

module.exports = { exportModelsBackup, BACKUP_FORMAT, BACKUP_VERSION };
