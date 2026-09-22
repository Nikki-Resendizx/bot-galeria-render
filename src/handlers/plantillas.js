const { saveBienvenida } = require('../config/db');
module.exports = (bot) => {
  bot.command('bienvenida', async (ctx) => {
    if(String(ctx.from.id) !== String(process.env.ADMIN_ID)) return;
    const texto = ctx.message.text.replace('/bienvenida','').trim();
    if(!texto) return ctx.reply("Uso: /bienvenida Tu mensaje aquí");
    saveBienvenida(texto);
    ctx.reply("✅ Bienvenida guardada en nube TG");
  });
};
