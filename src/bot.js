const { Telegraf } = require('telegraf');
const { BOT_TOKEN } = require('./config');

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN no definido en Render > Environment');
}

const bot = new Telegraf(BOT_TOKEN);

// Middleware premium (por ahora deja pasar todo)
const premiumMiddleware = require('./middlewares/premium');
bot.use(premiumMiddleware);

// Cargar handlers con inyección de bot
require('./handlers')(bot);

module.exports = { bot };
