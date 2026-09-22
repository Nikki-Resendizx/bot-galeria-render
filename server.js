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
  try {
    await bot.launch();
    console.log('✅ Bot iniciado - botones 🔵🔴 + premium');
  } catch (e) {
    console.error('❌ Error bot.launch:', e.message);
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
