const { getStorage, saveStorageIndex } = require('./config/db');

async function publishPhotoToStorage(telegram, key, fileId, caption='') {
  const storage = await getStorage();
  const topic = storage.topics?.[key];
  const groupId = storage.group_id;
  if (!groupId || !topic?.message_thread_id) {
    throw new Error('El almacenamiento Telegram no está vinculado para: ' + key);
  }

  const sent = await telegram.sendPhoto(groupId, fileId, {
    message_thread_id: Number(topic.message_thread_id),
    caption: caption || undefined
  });

  const savedFileId = sent.photo?.at(-1)?.file_id || fileId;
  await saveStorageIndex(key, {
    file_id: savedFileId,
    message_id: sent.message_id,
    message_thread_id: Number(topic.message_thread_id),
    group_id: String(groupId),
    caption: caption || ''
  });

  return { message: sent, fileId: savedFileId };
}

async function publishDocumentToStorage(telegram, key, fileId, caption='') {
  const storage = await getStorage();
  const topic = storage.topics?.[key];
  const groupId = storage.group_id;
  if (!groupId || !topic?.message_thread_id) {
    throw new Error('El almacenamiento Telegram no está vinculado para: ' + key);
  }

  const sent = await telegram.sendDocument(groupId, fileId, {
    message_thread_id: Number(topic.message_thread_id),
    caption: caption || undefined
  });

  await saveStorageIndex(key, {
    file_id: fileId,
    message_id: sent.message_id,
    message_thread_id: Number(topic.message_thread_id),
    group_id: String(groupId),
    caption: caption || ''
  });

  return { message: sent, fileId };
}

module.exports = { publishPhotoToStorage, publishDocumentToStorage };