require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Cargar panel admin + todos los handlers V16.1
try{
  require('./handlers')(bot);
  console.log("✅ Handlers admin + modelos cargados - Nube TG");
}catch(e){
  console.log("Error handlers:", e.message);
}

bot.catch((err, ctx) => {
  console.error(`Error en ${ctx.updateType}:`, err.message);
});

module.exports = { bot };
