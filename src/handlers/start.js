const { Markup } = require('telegraf');
const { saveUser, getConfig, getBotMedia } = require('../config/db');
const { replaceVars } = require('../utils');
const { webAppButton, urlButton, button } = require('../buttons');

module.exports = bot => bot.start(async ctx => {
  try {
    const from = ctx.from || {};
    await saveUser(from.id, {
      username: from.username || '',
      first_name: from.first_name || '',
      last_name: from.last_name || ''
    });

    const [c, m] = await Promise.all([getConfig(), getBotMedia()]);
    const t = replaceVars(
      c.bienvenida_texto || '👋 ¡Hola {mencion}! 💎\n\nBienvenid@ a VerifiedModels ✨',
      ctx
    );

    const rows = [[
      await webAppButton('webapp', process.env.WEBAPP_URL || ''),
      await button('modelos')
    ]];
    if (process.env.CANAL_FREE_URL) rows.push([await urlButton('canal_free', process.env.CANAL_FREE_URL)]);
    const keyboard = Markup.inlineKeyboard(rows);

    if (m.bienvenida) {
      try {
        return await ctx.replyWithPhoto(m.bienvenida, { caption: t, parse_mode: 'HTML', ...keyboard });
      } catch (photoError) {
        console.error('Error enviando bienvenida:', photoError);
        return ctx.reply(t, { parse_mode: 'HTML', ...keyboard });
      }
    }
    return ctx.reply(t, { parse_mode: 'HTML', ...keyboard });
  } catch (error) {
    console.error('Error en /start:', error);
    return ctx.reply('❌ No pude cargar la bienvenida. Revisa la configuración del bot.');
  }
});