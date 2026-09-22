require('dotenv').config();
const express = require('express');
const { bot } = require('./src/bot');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('✅ Bot Galeria Live v14 - 🔵🔴');
});

app.listen(PORT, async () => {
  console.log(`Web server en ${PORT}`);
  (async () => {
    try {
      // FIX 409 - borra webhook viejo y espera
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      await new Promise(r => setTimeout(r, 2000));
      await bot.launch({ 
        dropPendingUpdates: true,
        allowedUpdates: ['message','callback_query','my_chat_member'] 
      });
      console.log('✅ Bot iniciado - botones 🔵🔴 + premium');
    } catch (e) {
      console.error('❌ Error bot.launch:', e.message);
      // reintento en 5s si hay 409
      setTimeout(() => bot.launch({ dropPendingUpdates: true }), 5000);
    }
  })();
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
