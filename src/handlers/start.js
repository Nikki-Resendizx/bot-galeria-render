const { saveUser, getBienvenida } = require('../config/db');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    const id = ctx.from.id;
    const nombre = ctx.from.first_name || 'Hermosa';

    // Guardar en nube de Telegram
    saveUser(id, {
      id,
      username: ctx.from.username || '',
      first_name: nombre
    });

    // Respaldo en canal
    try {
      await ctx.telegram.sendMessage(
        process.env.CANAL_ID,
        `👤 <b>NUEVA USUARIA</b>\n\nID: <code>${id}</code>\nNombre: ${nombre}\nUsername: @${ctx.from.username || 'sin username'}`,
        { parse_mode: 'HTML' }
      );
    } catch(e){ console.log("No se pudo avisar al canal:", e.message); }

    const bienvenida = getBienvenida();
    const texto = bienvenida || `👸🏻 ¡Bienvenida ${nombre}! ✨\n\nTu perfil ya está guardado en la nube ☁️\n\nUsa /modelos para ver la galería\n🌐 ${process.env.WEBAPP_URL}`;

    console.log(`✅ Usuario ${id} guardado en nube TG`);
    return ctx.reply(texto, { parse_mode: 'HTML' });
  });
};
