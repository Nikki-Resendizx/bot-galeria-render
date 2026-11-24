const { db, admin } = require('./firebase');

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

function deserialize(value) {
  if (Array.isArray(value)) return value.map(deserialize);
  if (value && typeof value === 'object') {
    if (value.__firestore_type === 'timestamp') {
      const seconds = Number(value.seconds || 0);
      const nanoseconds = Number(value.nanoseconds || 0);
      return new admin.firestore.Timestamp(seconds, nanoseconds);
    }
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = deserialize(item);
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

function validateBackup(backup) {
  if (!backup || backup.format !== BACKUP_FORMAT || backup.version !== BACKUP_VERSION) {
    throw new Error('El archivo no es un Backup compatible de VerifiedModels (formato o versión incorrectos).');
  }
  if (!Array.isArray(backup.models)) throw new Error('El Backup no contiene una lista válida de modelos.');
  for (const model of backup.models) {
    if (!model || typeof model.id !== 'string' || !model.id.trim() || !model.data || typeof model.data !== 'object') {
      throw new Error('El Backup contiene un registro de modelo inválido.');
    }
    for (const key of ['votos', 'comentarios']) {
      if (model[key] !== undefined && !Array.isArray(model[key])) {
        throw new Error('El Backup contiene una colección ' + key + ' inválida.');
      }
    }
  }
  return backup;
}

async function importModelsBackup(input) {
  const backup = validateBackup(input);
  let operations = 0;
  let batch = db.batch();

  async function commitIfNeeded(force = false) {
    if (operations >= 400 || (force && operations > 0)) {
      await batch.commit();
      batch = db.batch();
      operations = 0;
    }
  }

  for (const model of backup.models) {
    const modelRef = db.collection('modelos').doc(model.id);
    batch.set(modelRef, deserialize(model.data), { merge: true });
    operations++;

    for (const vote of model.votos || []) {
      if (!vote?.id || !vote.data || typeof vote.data !== 'object') continue;
      batch.set(modelRef.collection('votos').doc(String(vote.id)), deserialize(vote.data), { merge: true });
      operations++;
      await commitIfNeeded();
    }

    for (const comment of model.comentarios || []) {
      if (!comment?.id || !comment.data || typeof comment.data !== 'object') continue;
      batch.set(modelRef.collection('comentarios').doc(String(comment.id)), deserialize(comment.data), { merge: true });
      operations++;
      await commitIfNeeded();
    }
    await commitIfNeeded();
  }

  if (backup.modelMedia && typeof backup.modelMedia === 'object' && Object.keys(backup.modelMedia).length) {
    const media = deserialize(backup.modelMedia);
    batch.set(db.collection('config').doc('storage'), { media }, { merge: true });
    operations++;
  }
  await commitIfNeeded(true);

  return {
    importedModels: backup.models.length,
    importedVotes: backup.models.reduce((n, model) => n + (model.votos || []).length, 0),
    importedComments: backup.models.reduce((n, model) => n + (model.comentarios || []).length, 0),
    importedMedia: Object.keys(backup.modelMedia || {}).length,
    createdAt: backup.createdAt || null
  };
}

module.exports = { exportModelsBackup, importModelsBackup, validateBackup, BACKUP_FORMAT, BACKUP_VERSION };
