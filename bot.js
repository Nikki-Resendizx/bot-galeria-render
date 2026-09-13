const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);
const premiumMiddleware = require('./middlewares/premium');
premiumMiddleware(bot);
module.exports={ bot };
