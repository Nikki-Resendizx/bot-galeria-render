const { Markup } = require('telegraf');
const { saveUser, getConfig, getBotMedia } = require('../config/db');
const { replaceVars } = require('../utils');
const { webAppButton, urlButton, button } = require('../buttons');

module.exports = bot => bot.start(async ctx => {
  try {
    const from = ctx.from || {};
    // El registro del usuario nunca debe impedir que /start responda.
    try {
      await saveUser(from.id, {
        username: from.username || '',
        first_name: from.first_name || '',
        last_name: from.last_name || ''
      });
    } catch (userError) {
      console.error('Error registrando usuario en Firebase:', userError);
    }

    const [c, m] = await Promise.all([getConfig(), getBotMedia()]);
    const t = replaceVars(
      c.bienvenida_texto || '👋 ¡Hola {mencion}! 💎\n\nBienvenid@ a VerifiedModels ✨',
      ctx
    );

    const rows = [];
    // No crear un botón WebApp inválido si WEBAPP_URL no está configurada.
    if (process.env.WEBAPP_URL) {
      rows.push([await webAppButton('webapp', process.env.WEBAPP_URL)]);
    }
    rows.push([await button('modelos', { style: 'danger' })]);
    if (process.env.CANAL_FREE_URL) rows.push([await urlButton('canal_free', process.env.CANAL_FREE_URL, { style: 'success' })]);
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