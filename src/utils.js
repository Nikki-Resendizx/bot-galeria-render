const { ADMIN_IDS_ENV } = require('./config');

function isAdmin(userId) {
  try {
    if (!userId) return false;
    // soporta que te pasen ctx o id
    const id = typeof userId === 'object' ? (userId.from?.id || userId.fromId) : userId;
    if (!id) return false;
    return ADMIN_IDS_ENV.includes(String(id));
  } catch(e){ return false; }
}

function replaceVars(text, ctx) {
  if (!text) return "";
  const name = ctx.from?.first_name || "bebé";
  const username = ctx.from?.username ? `@${ctx.from.username}` : name;
  return text.replace(/{nombre}/g, name).replace(/{usuario}/g, username).replace(/{mencion}/g, name).replace(/{mencion}/g, name);
}

module.exports = { isAdmin, replaceVars };
