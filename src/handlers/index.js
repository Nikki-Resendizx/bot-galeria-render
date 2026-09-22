const startHandler = require('./start');
const adminHandler = require('./admin');
const plantillasHandler = require('./plantillas');
const modelosHandler = require('./modelos');
const galeriaHandler = require('./galeria');
const textHandler = require('./text');
const { db } = require('../config/db');

const STORAGE_TOPICS = {
  bienvenida: '👋 BIENVENIDA',
  galeria: '🖼️ GALERÍA',
  modelos: '💃 MODELOS',
  plantillas: '📝 PLANTILLAS',
  botones: '🔘 BOTONES',
  otros: '📦 OTROS'
};

function normalizeTopicName(name = '') {
  return name
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase();
}

function registerStorageLink(bot) {
  bot.command('vincular', async (ctx) => {
    try {
      if (!ctx.chat || (ctx.chat.type !== 'supergroup')) {
        return ctx.reply('❌ Este comando solo se puede usar dentro del grupo de almacenamiento.');
      }

      const threadId = ctx.message && ctx.message.message_thread_id;
      if (!threadId) {
        return ctx.reply('❌ Este mensaje no pertenece a un tema. Entra a uno de los temas y vuelve a enviar /vincular.');
      }

      const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
      if (!['creator', 'administrator'].includes(member.status)) {
        return ctx.reply('❌ Solo un administrador puede vincular los temas.');
      }

      const topic = await ctx.telegram.getForumTopic(ctx.chat.id, threadId);
      const normalized = normalizeTopicName(topic.name);

      const match = Object.entries(STORAGE_TOPICS).find(([, label]) =>
        normalizeTopicName(label) === normalized
      );

      if (!match) {
        return ctx.reply(
          '⚠️ No reconozco este tema. Usa exactamente uno de estos nombres:\n\n' +
          Object.values(STORAGE_TOPICS).join('\n')
        );
      }

      const [key, label] = match;

      await db.collection('config').doc('storage').set({
        group_id: String(ctx.chat.id),
        topics: {
          [key]: {
            name: label,
            message_thread_id: Number(threadId)
          }
        },
        actualizado: new Date().toISOString()
      }, { merge: true });

      return ctx.reply(
        `✅ Tema vinculado correctamente.\\n\\n${label}\\n🆔 Topic ID: ${threadId}`
      );
    } catch (error) {
      console.error('Error vinculando tema:', error);
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
