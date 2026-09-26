const { getButtonConfig } = require('./config/db');

const DEFAULTS = {
  webapp: { text: '💎 Galería Virtual 💎', style: 'primary' },
  modelos: { text: '👑 Lista de Modelos 👑', style: 'danger', callback_data: 'public_modelos' },
  canal_free: { text: '📢 Canal OFICIAL 📢', style: 'success' },
  bueno: { text: '🟢 BUENO', style: 'success' },
  malo: { text: '🔴 MALO', style: 'danger' },
  contacto: { text: '📞 CONTACTO', style: 'primary' }
};

const SECTION_ALIASES = {
  plantilla: 'plantilla',
  plantillas: 'plantilla',
  inicio: 'inicio',
  bienvenida: 'inicio',
  galeria: 'galeria'
};

function normalizeStyle(style) {
  const value = String(style || '').trim().toLowerCase();
  return ['primary', 'success', 'danger'].includes(value) ? value : 'primary';
}

function normalizeButtonKey(key) {
  return String(key || '').trim();
}

function splitButtonKey(key) {
  const raw = normalizeButtonKey(key);
  const dot = raw.indexOf('.');
  if (dot < 1) return { section: '', key: raw };
  const section = SECTION_ALIASES[raw.slice(0, dot).toLowerCase()] || raw.slice(0, dot).toLowerCase();
  return { section, key: raw.slice(dot + 1) };
}

function cleanCustomEmojiText(text, entities = [], baseOffset = 0) {
  let value = String(text || '');
  const ranges = (entities || [])
    .filter(e => e.type === 'custom_emoji' && e.custom_emoji_id)
    .map(e => ({
      start: Number(e.offset || 0) - Number(baseOffset || 0),
      end: Number(e.offset || 0) - Number(baseOffset || 0) + Number(e.length || 0)
    }))
    .filter(r => r.start >= 0 && r.end <= value.length)
    .sort((a,b) => b.start - a.start);
  for (const r of ranges) value = value.slice(0, r.start) + value.slice(r.end);
  return value.replace(/^\s+|\s+$/g, '').replace(/[ \t]{2,}/g, ' ');
}

function buildButtonConfig(all, key, section, extra = {}) {
  const globalConfig = all && all[key] && typeof all[key] === 'object' ? all[key] : {};
  const sectionConfig = section && all && all[section] && typeof all[section] === 'object' &&
    all[section][key] && typeof all[section][key] === 'object'
    ? all[section][key] : {};

  return Object.assign(
    {},
    DEFAULTS[key] || { text: key, style: 'primary' },
    globalConfig,
    sectionConfig,
    extra
  );
}

async function button(key, extra = {}) {
  const all = await getButtonConfig();
  const section = extra.section ? (SECTION_ALIASES[String(extra.section).toLowerCase()] || String(extra.section)) : '';
  const cleanExtra = { ...extra };
  delete cleanExtra.section;

  const c = buildButtonConfig(all, normalizeButtonKey(key), section, cleanExtra);
  const out = {
    text: String(c.text ?? key),
    style: normalizeStyle(c.style)
  };

  if (c.callback_data) out.callback_data = String(c.callback_data);
  if (c.url) out.url = String(c.url);
  if (c.web_app) out.web_app = c.web_app;
  if (c.icon_custom_emoji_id) out.icon_custom_emoji_id = String(c.icon_custom_emoji_id);

  return out;
}

async function urlButton(key, url, extra = {}) {
  return button(key, { ...extra, url: String(url || '') });
}

async function webAppButton(key, url, extra = {}) {
  return button(key, { ...extra, web_app: { url: String(url || '') } });
}

module.exports = {
  button,
  urlButton,
  webAppButton,
  DEFAULTS,
  normalizeStyle,
  normalizeButtonKey,
  splitButtonKey,
  buildButtonConfig,
  cleanCustomEmojiText
};
