const { ADMIN_IDS_ENV } = require('./config');

function isAdmin(userId) {
  if (!userId) return false;
  return ADMIN_IDS_ENV.includes(String(userId));
}

function replaceVars(text, ctx) {
  if (!text) return "";
  const name = ctx.from?.first_name || "bebé";
  const username = ctx.from?.username ? `@${ctx.from.username}` : name;
  return text.replace(/{nombre}/g, name).replace(/{usuario}/g, username);
}

module.exports = { isAdmin, replaceVars };
