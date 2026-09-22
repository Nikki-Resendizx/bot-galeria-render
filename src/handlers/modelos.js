const { getModelos, voteModelo, getModelBotMedia } = require('../config/db');
const { escapeHtml } = require('../utils');
const { Markup } = require('telegraf');
const { button } = require('../buttons');

async function send(ctx) {
  const list = await getModelos();
  if (!list.length) return ctx.reply('😔 Aún no hay modelos disponibles.');

  for (const m of list) {
    const total = Number(m.votosBueno || 0) + Number(m.votosMalo || 0);
    const c = [
      '👸🏻 <b>' + escapeHtml(m.perfil || m.username || 'Modelo') + '</b>',
      '',
      m.descripcion ? escapeHtml(m.descripcion) : '',
      '🎂 ' + escapeHtml(m.edad ?? '') + '  🌎 ' + escapeHtml(m.nacionalidad || ''),
      '💎 ' + escapeHtml(m.servicios || ''),
      '👍 ' + Number(m.votosBueno || 0) + '  👎 ' + Number(m.votosMalo || 0) + '  • ' + total + ' votos'
    ].filter(Boolean).join('\n');

    const kb = Markup.inlineKeyboard([[
      await button('bueno', { callback_data: 'voto_bueno:' + m.id }),
      await button('malo', { callback_data: 'voto_malo:' + m.id })
    ]]);

    try {
      // Las fotos principales guardadas por el bot viven en Telegram Storage.
      // Firebase conserva la referencia file_id en config/storage/modelos/{id}.
      const media = await getModelBotMedia(m.id);
      const fileId = media?.file_id;

      if (fileId) {
        await ctx.replyWithPhoto(fileId, { caption: c, parse_mode: 'HTML', ...kb });
      } else if (m.foto && /^https?:\/\//i.test(String(m.foto))) {
        // Compatibilidad con modelos antiguos que todavía tengan una URL.
        await ctx.replyWithPhoto(m.foto, { caption: c, parse_mode: 'HTML', ...kb });
      } else {
        await ctx.reply(c, { parse_mode: 'HTML', ...kb });
      }
    } catch (e) {
      console.error('Error enviando modelo:', m.id, e);
      await ctx.reply(c, { parse_mode: 'HTML', ...kb });
    }
  }
}

module.exports = bot => {
  bot.command('modelos', send);

  bot.action('public_modelos', async ctx => {
    await ctx.answerCbQuery();
    return send(ctx);
  });

  bot.action(/^voto_(bueno|malo):(.+)$/, async ctx => {
    try {
      const type = ctx.match[1];
      const id = ctx.match[2];
      const n = await voteModelo(id, type);
      await ctx.answerCbQuery(type === 'bueno' ? '👍 Voto registrado' : '👎 Voto registrado');
      return ctx.reply((type === 'bueno' ? '👍' : '👎') + ' Voto registrado. Total de este tipo: ' + n);
    } catch (e) {
      console.error('Error voto bot:', e);
      return ctx.answerCbQuery('No se pudo registrar el voto', { show_alert: true });
    }
  });
};