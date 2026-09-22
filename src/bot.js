const { Telegraf } = require('telegraf');

function createBot(){
  const bot = new Telegraf(process.env.BOT_TOKEN);
  
  // Cargar todos los handlers
  require('./handlers')(bot);
  
  // Manejo de errores
  bot.catch((err, ctx) => {
    console.error(`Error en ${ctx.updateType}`, err);
  });

  return bot;
}

module.exports = { createBot };
