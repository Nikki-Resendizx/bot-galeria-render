const { Telegraf } = require('telegraf');
const { BOT_TOKEN } = require('./config');
if(!BOT_TOKEN) throw new Error("BOT_TOKEN");
const bot = new Telegraf(BOT_TOKEN);
require('./handlers')(bot);
bot.catch((err,ctx)=> console.log(`Error ${ctx.updateType}`,err.message));
module.exports = { bot };
