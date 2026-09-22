const { Telegraf } = require('telegraf');

if(!process.env.BOT_TOKEN){
  console.error("❌ FALTA BOT_TOKEN");
  process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.catch((err, ctx) => {
  console.log(`❌ Error para ${ctx.updateType}:`, err.message);
});

require('./handlers')(bot);

module.exports = { bot };
