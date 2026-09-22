const { Telegraf } = require('telegraf');
const { BOT_TOKEN } = require('./config');
if (!BOT_TOKEN) throw new Error('BOT_TOKEN no definido en Render');
const bot = new Telegraf(BOT_TOKEN);
const premiumMiddleware = require('./middlewares/premium');
bot.use(premiumMiddleware);
require('./handlers')(bot);
module.exports = { bot };
