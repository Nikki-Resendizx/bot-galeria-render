const startHandler = require('./start');
const adminHandler = require('./admin');
const plantillasHandler = require('./plantillas');
const modelosHandler = require('./modelos');
const galeriaHandler = require('./galeria');
const textHandler = require('./text');
const { db } = require('../firebase');
const { STORAGE_TOPICS } = require('../storage');

const STORAGE_TOPIC_NAMES = {
  bienvenida: '👋 BIENVENIDA',
  plantillas: '📝 PLANTILLAS',
  galeria: '🖼️ GALERÍA',
  botones: '🔘 BOTONES',
  admins: '👑 ADMINS',
  usuarios: '👥 USUARIOS',
  modelos: '💃 MODELOS'
};

function registerStorageLink(bot) {
  bot.command('vincular', async ctx => {
    try {
      if (!ctx.chat || ctx.chat.type !== 'supergroup') {
        return ctx.reply('❌ Este comando solo se puede usar dentro del grupo de almacenamiento.');
      }

      const threadId = ctx.message?.message_thread_id;
      if (!threadId) {
        return ctx.reply('❌ Este comando debe enviarse dentro de uno de los 7 temas.');
      }

      const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
      if (!['creator', 'administrator'].includes(member.status)) {
        return ctx.reply('❌ Solo un administrador puede vincular los temas.');
      }

      const key = String(ctx.message.text || '').trim().split(/\s+/)[1]?.toLowerCase();
      if (!STORAGE_TOPICS.includes(key)) {
        return ctx.reply(
          '❌ Tema no válido. Usa uno de estos nombres:\n\n' +
          Object.entries(STORAGE_TOPIC_NAMES).map(([k, v]) => '• ' + k + ' → ' + v).join('\n')
        );
      }

      const label = STORAGE_TOPIC_NAMES[key];
      const storageRef = db.collection('config').doc('storage');
      const current = await storageRef.get();
      const currentData = current.exists ? (current.data() || {}) : {};
      const previousGroup = String(currentData.group_id || '').trim();

      if (previousGroup && previousGroup !== String(ctx.chat.id)) {
        return ctx.reply('❌ Este Store ya está vinculado a otro grupo. Desvincúlalo o usa el grupo Store configurado.');
      }

      await storageRef.set({
        group_id: String(ctx.chat.id),
        topics: {
          [key]: {
            key,
            name: label,
            message_thread_id: Number(threadId),
            linked_at: new Date().toISOString()
          }
        },
        storage_version: 2,
        total_topics: STORAGE_TOPICS.length,
        actualizado: new Date().toISOString()
      }, { merge: true });

      const updated = await storageRef.get();
      const data = updated.data() || {};
      const linked = STORAGE_TOPICS.filter(k => Number(data.topics?.[k]?.message_thread_id) > 0).length;

      return ctx.reply(
        '✅ <b>' + label + '</b> vinculado correctamente.\n\n' +
        '🆔 Topic ID: <code>' + Number(threadId) + '</code>\n' +
        '📦 Storage: <b>' + linked + '/' + STORAGE_TOPICS.length + '</b>',
        { parse_mode: 'HTML' }
      );
    } catch (error) {
      console.error('STORAGE: error vinculando tema:', error);
      return ctx.reply('❌ No pude vincular este tema. Revisa que el bot sea administrador del grupo.');
    }
  });
}

function registerHandlers(bot) {
  startHandler(bot);
  adminHandler(bot);
  plantillasHandler(bot);
  modelosHandler(bot);
  galeriaHandler(bot);
  registerStorageLink(bot);
  textHandler(bot);
  console.log('✅ Todos los handlers cargados');
}

module.exports = { registerHandlers };
