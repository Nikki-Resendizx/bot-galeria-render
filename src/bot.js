const { Telegraf } = require('telegraf');
const { BOT_TOKEN } = require('./config');

if (!BOT_TOKEN) throw new Error("BOT_TOKEN no definido en .env");

const bot = new Telegraf(BOT_TOKEN);

// CARGAMOS LOS HANDLERS - ESTO ERA LO QUE FALTABA
const registerHandlers = require('./handlers');
registerHandlers(bot);

bot.catch((err, ctx) => {
  console.log(`Unhandled error while processing ${ctx.updateType}`, err);
});

module.exports = { bot };
