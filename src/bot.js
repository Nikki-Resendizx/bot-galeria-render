// src/bot.js
const { Telegraf } = require('telegraf');
const { BOT_TOKEN } = require('./config');

if (!BOT_TOKEN) throw new Error('BOT_TOKEN no definido en Render');

const bot = new Telegraf(BOT_TOKEN);

// 1. Middleware premium PRIMERO
const premiumMiddleware = require('./middlewares/premium');
bot.use(premiumMiddleware);

// 2. Luego los handlers
require('./handlers/index')(bot);

module.exports = { bot };
