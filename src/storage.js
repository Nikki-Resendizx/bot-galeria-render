const { getStorage, saveStorageIndex } = require('./config/db');

const STORAGE_TOPICS = Object.freeze([
  'bienvenida','plantillas','galeria','botones','admins','usuarios','modelos'
]);

function isValidTopicId(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

async function getTopic(key) {
  const normalized = String(key || '').trim().toLowerCase();
  if (!STORAGE_TOPICS.includes(normalized)) throw new Error('Tema Storage no válido: ' + normalized);
  const storage = await getStorage();
  const groupId = String(storage.group_id || '').trim();
  const threadId = storage.topics?.[normalized]?.message_thread_id;
  if (!groupId || !isValidTopicId(threadId)) throw new Error('El almacenamiento Telegram no está vinculado para: ' + normalized);
  return { key: normalized, groupId, threadId: Number(threadId) };
}

async function deleteStorageMessage(telegram, media) {
  if (!media?.group_id || !media?.message_id) return false;
  try { await telegram.deleteMessage(String(media.group_id), Number(media.message_id)); return true; }
  catch (e) { console.error('STORAGE: no se pudo borrar mensaje', media.message_id, e.message || e); return false; }
}

async function publishPhotoToStorage(telegram, key, fileId, caption = '', options = {}) {
  const topic = await getTopic(key);
  const storage = await getStorage();
  const oldMedia = storage.media?.[String(key)];
  if (!fileId) throw new Error('Falta file_id para guardar en Storage.');

  const sent = await telegram.sendPhoto(topic.groupId, fileId, {
    message_thread_id: topic.threadId,
    caption: caption || undefined,
    ...(options.parse_mode ? { parse_mode: options.parse_mode } : {}),
    ...(Array.isArray(options.entities) && options.entities.length ? { entities: options.entities } : {})
  });

  const savedFileId = sent.photo?.at(-1)?.file_id || fileId;
  const record = { file_id:savedFileId, message_id:sent.message_id, message_thread_id:topic.threadId, group_id:topic.groupId, caption:caption || '', actualizado:new Date().toISOString() };
  await saveStorageIndex(key, record);

  if (['bienvenida','galeria'].includes(String(key)) && oldMedia?.message_id && String(oldMedia.message_id) !== String(sent.message_id)) {
    await deleteStorageMessage(telegram, oldMedia);
  }
  return { message:sent, fileId:savedFileId, ...record };
}

async function publishTextToStorage(telegram, key, text, options = {}) {
  const topic = await getTopic(key);
  const value = String(text || '');
  if (!value) throw new Error('No se puede guardar un texto vacío en Storage.');
  const payload = { message_thread_id:topic.threadId };
  if (options.parse_mode) payload.parse_mode = options.parse_mode;
  if (Array.isArray(options.entities) && options.entities.length) payload.entities = options.entities;
  const sent = await telegram.sendMessage(topic.groupId, value, payload);
  await saveStorageIndex('text_' + key, { message_id:sent.message_id, message_thread_id:topic.threadId, group_id:topic.groupId, text:value, actualizado:new Date().toISOString() });
  return sent;
}

async function publishDocumentToStorage(telegram, key, fileId, caption = '') {
  const topic = await getTopic(key);
  if (!fileId) throw new Error('Falta file_id para guardar en Storage.');
  const sent = await telegram.sendDocument(topic.groupId, fileId, { message_thread_id:topic.threadId, caption:caption || undefined });
  const record = { file_id:sent.document?.file_id || fileId, message_id:sent.message_id, message_thread_id:topic.threadId, group_id:topic.groupId, caption:caption || '', actualizado:new Date().toISOString() };
  await saveStorageIndex(key, record);
  return { message:sent, fileId:record.file_id, ...record };
}

async function publishModelPhoto(telegram, modelId, fileId, caption = '') {
  const id = String(modelId || '').trim();
  if (!id) throw new Error('Falta ID de modelo.');
  if (!fileId) throw new Error('Falta file_id para guardar en Storage.');
  const topic = await getTopic('modelos');
  const storage = await getStorage();
  const oldMedia = storage.media?.['modelo_' + id];
  const sent = await telegram.sendPhoto(topic.groupId, fileId, { message_thread_id:topic.threadId, caption:caption || undefined });
  const savedFileId = sent.photo?.at(-1)?.file_id || fileId;
  const record = { file_id:savedFileId, message_id:sent.message_id, message_thread_id:topic.threadId, group_id:topic.groupId, caption:caption || '', model_id:id, actualizado:new Date().toISOString() };
  await saveStorageIndex('modelo_' + id, record);
  if (oldMedia?.message_id && String(oldMedia.message_id) !== String(sent.message_id)) await deleteStorageMessage(telegram, oldMedia);
  return { message:sent, fileId:savedFileId, ...record };
}

async function publishTemplatePhoto(telegram, templateId, fileId, caption = '') {
  const id = String(templateId || '').trim();
  if (!id) throw new Error('Falta ID de plantilla.');
  if (!fileId) throw new Error('Falta file_id para guardar en Storage.');
  const topic = await getTopic('plantillas');
  const storage = await getStorage();
  const storageKey = 'plantilla_' + id;
  const oldMedia = storage.media?.[storageKey];
  const sent = await telegram.sendPhoto(topic.groupId, fileId, {
    message_thread_id: topic.threadId,
    caption: caption || undefined
  });
  const savedFileId = sent.photo?.at(-1)?.file_id || fileId;
  const record = {
    file_id: savedFileId,
    message_id: sent.message_id,
    message_thread_id: topic.threadId,
    group_id: topic.groupId,
    template_id: id,
    caption: caption || '',
    actualizado: new Date().toISOString()
  };
  await saveStorageIndex(storageKey, record);
  if (oldMedia?.message_id && String(oldMedia.message_id) !== String(sent.message_id)) {
    await deleteStorageMessage(telegram, oldMedia);
  }
  return { message: sent, fileId: savedFileId, ...record };
}

module.exports = { STORAGE_TOPICS, getTopic, publishPhotoToStorage, publishDocumentToStorage, publishTextToStorage, publishModelPhoto, deleteStorageMessage };
