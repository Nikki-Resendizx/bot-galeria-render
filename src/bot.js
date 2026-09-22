const { Telegraf } = require('telegraf');
const { BOT_TOKEN } = require('./config');

if (!BOT_TOKEN) throw new Error("BOT_TOKEN no definido en .env");

const bot = new Telegraf(BOT_TOKEN);

// Para que no se caiga todo el deploy con un error
bot.catch((err, ctx) => {
  console.log(`Unhandled error while processing ${ctx.updateType}`, err);
});

module.exports = { bot };
