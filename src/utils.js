const { ADMIN_IDS_ENV } = require('./config');

function isAdmin(userId) {
  try {
    if (!userId) return false;
    // soporta que te pasen ctx o id directo
    const id = typeof userId === 'object' ? (userId.from?.id || userId.fromId || userId.id) : userId;
    if (!id) return false;
    const strId = String(id).trim();
    // Comparamos como string para evitar fallo de tipo
    return ADMIN_IDS_ENV.map(s => String(s).trim()).includes(strId);
  } catch(e){ 
    console.log("Error isAdmin:", e.message);
    return false; 
  }
}

function replaceVars(text, ctx) {
  if (!text) return "";
  try {
    const name = ctx.from?.first_name || "bebé";
    const username = ctx.from?.username ? `@${ctx.from.username}` : name;
    const fullName = ctx.from?.first_name ? `${ctx.from.first_name} ${ctx.from?.last_name||''}`.trim() : name;
    return text
      .replace(/{nombre}/g, name)
      .replace(/{usuario}/g, username)
      .replace(/{username}/g, username)
      .replace(/{mencion}/g, name)
      .replace(/{nombre_completo}/g, fullName);
  } catch(e) {
    return text;
  }
}

module.exports = { isAdmin, replaceVars };
