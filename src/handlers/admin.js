module.exports = (bot) => {
  bot.command('admin', (ctx) => {
    if(String(ctx.from.id) !== String(process.env.ADMIN_ID)) return;
    ctx.reply(`🔐 Panel Admin V16.1\n\n🌐 WebApp: ${process.env.WEBAPP_URL}\n📦 DB: /tmp/database.json (Nube TG)\n✅ Sistema de avisos activo`);
  });
};
