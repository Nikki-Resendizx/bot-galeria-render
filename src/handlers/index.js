const startHandler = require('./start');
const adminHandler = require('./admin');
const plantillasHandler = require('./plantillas');
const modelosHandler = require('./modelos');
const galeriaHandler = require('./galeria');
const textHandler = require('./text');
const { db } = require('../config/db');

const STORAGE_TOPICS = {
  bienvenida: '👋 BIENVENIDA',
  plantillas: '📝 PLANTILLAS',
  galeria: '🖼️ GALERÍA',
  botones: '🧩 BOTONES',
  admins: '👑 ADMINS',
  usuarios: '👥 USUARIOS',
  modelos: '💃 MODELOS'
};

function registerStorageLink(bot) {
  bot.command('vincular', async (ctx) => {
    try {
      if (!ctx.chat || ctx.chat.type !== 'supergroup') {
        return ctx.reply('❌ Este comando solo se puede usar dentro del grupo de almacenamiento.');
      }

      const threadId = ctx.message?.message_thread_id;
      if (!threadId) {
        return ctx.reply('❌ Este comando debe enviarse dentro de uno de los temas.');
      }

      const member = await ctx.telegram.getChatMember(ctx.chat.id, ctx.from.id);
      if (!['creator', 'administrator'].includes(member.status)) {
        return ctx.reply('❌ Solo un administrador puede vincular los temas.');
      }

      const parts = (ctx.message.text || '').trim().split(/\s+/);
      const key = (parts[1] || '').toLowerCase();

      if (!STORAGE_TOPICS[key]) {
        return ctx.reply(
          '❌ Indica qué tema estás vinculando. Ejemplos:\n\n' +
          '/vincular bienvenida\n' +
          '/vincular galeria\n' +
          '/vincular modelos\n' +
          '/vincular plantillas\n' +
          '/vincular botones\n' +
          '/vincular admins\n' +
          '/vincular usuarios\n' +
          '/vincular modelos\n' +
          '/vincular otros'
        );
      }

      const label = STORAGE_TOPICS[key];

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
        `✅ ${label} vinculado correctamente.\n\n🆔 Topic ID: ${threadId}`
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
