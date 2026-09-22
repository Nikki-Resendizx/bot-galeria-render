const { Telegraf } = require('telegraf');
const token = process.env.BOT_TOKEN;
if (!token) throw new Error("Falta BOT_TOKEN en ENV");
const bot = new Telegraf(token);

// Carga handlers
try {
  require('./handlers')(bot);
  console.log("✅ Handlers V16 cargados");
} catch(e) {
  console.error("❌ Error handlers:", e.message);
}

module.exports = { bot };
