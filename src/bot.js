require('dotenv').config();
const { Telegraf } = require('telegraf');
const { registerHandlers } = require('./handlers');

if (!process.env.BOT_TOKEN) {
  throw new Error('Falta BOT_TOKEN en las variables de entorno');
}

const bot = new Telegraf(process.env.BOT_TOKEN);

registerHandlers(bot);

bot.catch((err, ctx) => {
  console.error(`Error en update ${ctx.updateType}:`, err);
});

module.exports = { bot };
