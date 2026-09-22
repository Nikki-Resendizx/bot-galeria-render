// src/server.js - Entry para Render
const { bot } = require('./bot');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot Galeria Live ✅'));
app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server en ${PORT}`));

// Iniciar bot
bot.launch().then(() => {
  console.log('✅ Bot iniciado - premium y botones de color activos');
}).catch(e => {
  console.error('Error bot:', e);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
