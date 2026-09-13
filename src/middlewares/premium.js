// 13. PREMIUM DETECTOR V15 - LIMPIO, SIN SPAM
module.exports = (bot) => {
  bot.on('message', async (ctx, next) => {
    // Solo contamos, no mandamos nada aquí
    // El conteo y la réplica se hace en text.js
    if (next) return next();
  });
};
