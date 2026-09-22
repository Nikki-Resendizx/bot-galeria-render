require('dotenv').config();
const express = require('express');
const { bot } = require('./src/bot');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send(`✅ Bot Galeria V16 PREMIUM Live - WebApp: ${process.env.WEBAPP_URL || 'https://galeria-verifiedmodels.pages.dev'}`);
});

app.get('/health', (req, res) => res.json({ status: 'ok', v: '16-premium', webapp: process.env.WEBAPP_URL, time: new Date().toISOString() }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Web server en ${PORT}`);
  console.log(`WebApp: ${process.env.WEBAPP_URL}`);
  iniciarBot();
});

async function iniciarBot(intentos = 0) {
  const MAX = 10;
  try {
    console.log(`[V16] Iniciando intento ${intentos+1}/${MAX}`);
    try {
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      console.log("[V16] Webhook borrado");
    } catch(e) {}
    const espera = 3000 + intentos*2000;
    await new Promise(r => setTimeout(r, espera));
    await bot.launch({ dropPendingUpdates: true, allowedUpdates: ['message','callback_query','my_chat_member'] });
    console.log("✅ BOT V16 PREMIUM INICIADO - https://galeria-verifiedmodels.pages.dev");
  } catch (e) {
    console.log(`❌ ${e.message}`);
    if (e.message.includes('409') && intentos < MAX) {
      console.log(`🔄 Reintentando 409 en 5s...`);
      setTimeout(() => iniciarBot(intentos+1), 5000);
    } else if(intentos >= MAX) {
      setTimeout(() => process.exit(1), 30000);
    }
  }
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
process.on('unhandledRejection', r => console.log("Unhandled:", r));
