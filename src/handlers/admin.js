const { Markup } = require('telegraf');
const { getBienvenida, getPlantillas, getModelos, getBotones, getGaleria, loadDB } = require('../config/db');

module.exports = (bot) => {
  bot.command('admin', async (ctx) => {
    if(String(ctx.from.id) !== String(process.env.ADMIN_ID)) return;

    const db = loadDB();
    const totalUsers = Object.keys(db.users || {}).length;
    const totalModelos = (db.modelos || []).length;

    const texto = `👸🏻 <b>PANEL ADMIN V16.1 PREMIUM</b> ✨

☁️ <b>DB:</b> Nube Telegram (/tmp/database.json)
👥 <b>Usuarias:</b> ${totalUsers}
💃 <b>Modelos:</b> ${totalModelos}
🌐 <b>WebApp:</b> ${process.env.WEBAPP_URL}

Todo con emojis premium y guardado en TG, sin Firebase 😎`;

    const botones = Markup.inlineKeyboard([
      [Markup.button.callback('💌 Bienvenida', 'adm_bienvenida'), Markup.button.callback('📝 Plantillas', 'adm_plantillas')],
      [Markup.button.callback('💃 Modelos (Fotos)', 'adm_modelos'), Markup.button.callback('🖼️ Galería', 'adm_galeria')],
      [Markup.button.callback('🎨 Botones Premium', 'adm_botones'), Markup.button.callback('📊 Estadísticas', 'adm_stats')],
      [Markup.button.callback('🌐 Abrir WebApp', 'adm_webapp'), Markup.button.callback('🔄 Recargar DB', 'adm_reload')]
    ]);

    return ctx.reply(texto, { parse_mode:'HTML', ...botones });
  });

  // CALLBACKS
  bot.action('adm_bienvenida', (ctx) => {
    ctx.answerCbQuery();
    const b = getBienvenida() || 'No configurada';
    ctx.reply(`💌 <b>BIENVENIDA ACTUAL:</b>\n\n${b}\n\nPara cambiar: <code>/bienvenida Tu nuevo texto con emojis 👸🏻✨</code>`, {parse_mode:'HTML'});
  });

  bot.action('adm_plantillas', (ctx) => {
    ctx.answerCbQuery();
    const p = getPlantillas();
    const lista = Object.keys(p).length ? Object.keys(p).map(k=>`• ${k}`).join('\n') : 'Sin plantillas';
    ctx.reply(`📝 <b>PLANTILLAS:</b>\n\n${lista}\n\nPara guardar: <code>/plantilla nombre | texto con emojis premium 🌸</code>`, {parse_mode:'HTML'});
  });

  bot.action('adm_modelos', (ctx) => {
    ctx.answerCbQuery();
