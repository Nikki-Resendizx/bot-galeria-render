const { Telegraf } = require('telegraf');
const { BOT_TOKEN } = require('./config');

if (!BOT_TOKEN) throw new Error("BOT_TOKEN no definido");

const bot = new Telegraf(BOT_TOKEN);

// CARGA DE HANDLERS - esto es lo que te falta
require('./handlers/start')(bot);
require('./handlers/admin')(bot);
require('./handlers/callbacks')(bot);
// etc

bot.catch((err, ctx) => {
  console.log(`Error ${ctx.updateType}`, err);
});

module.exports = { bot };
