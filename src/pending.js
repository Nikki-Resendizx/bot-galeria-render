const pending = new Map();

function setPending(userId, action) {
  pending.set(String(userId), action);
}

function getPending(userId) {
  return pending.get(String(userId));
}

function clearPending(userId) {
  pending.delete(String(userId));
}

function hasPending(userId) {
  return pending.has(String(userId));
}

function clearAllPending(userId) {
  const key = String(userId);
  pending.delete(key);
  if (global.__templatePending?.delete) global.__templatePending.delete(key);
}

module.exports = { setPending, getPending, clearPending, hasPending, clearAllPending };
