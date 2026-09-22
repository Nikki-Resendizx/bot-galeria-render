const { getButtonConfig } = require('./config/db');

const DEFAULTS = {
  webapp: { text: '💎 Galería Virtual 💎', style: 'primary' },
  modelos: { text: '👑 Lista de Modelos 👑', style: 'danger' },
  canal_free: { text: '📢 Canal OFICIAL 📢', style: 'success' },
  bueno: { text: '🟢 BUENO', style: 'success' },
  malo: { text: '🔴 MALO', style: 'danger' },
  contacto: { text: '📞 CONTACTO', style: 'primary' }
};

function normalizeStyle(style) {
  return ['primary', 'success', 'danger'].includes(String(style).toLowerCase())
    ? String(style).toLowerCase() : 'primary';
}

async function button(key, extra = {}) {
  const all = await getButtonConfig();
  const c = Object.assign({}, DEFAULTS[key] || { text: key, style: 'primary' }, all[key] || {}, extra);
  const out = { text: c.text, style: normalizeStyle(c.style), ...extra };
  if (c.icon_custom_emoji_id) out.icon_custom_emoji_id = String(c.icon_custom_emoji_id);
  return out;
}
async function urlButton(key, url) { return button(key, { url }); }
async function webAppButton(key, url) { return button(key, { web_app: { url } }); }
module.exports = { button, urlButton, webAppButton, DEFAULTS, normalizeStyle };