module.exports = (bot) => {
  bot.on('text', (ctx, next) => {
    const t = ctx.message.text;
    if(t.startsWith('/')) return next();
    // Si no es comando, no hace nada para no interferir
    return next();
  });
};
