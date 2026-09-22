// server.js - RAIZ - unico que usara Render
require('dotenv').config();
const { bot } = require('./src/bot');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot Galeria Live v14'));
app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server en ${PORT}`));

bot.launch().then(() => {
  console.log('✅ Bot iniciado - botones color + premium OK');
}).catch(e => {
  console.error(e);
  process.exit(1);
});
