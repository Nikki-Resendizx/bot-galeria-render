require('dotenv').config();

const express = require('express');
const { bot } = require('./src/bot');

const app = express();
app.disable('x-powered-by');

const PORT = Number(process.env.PORT) || 10000;
const HOST = '0.0.0.0';

let botStarted = false;
let shuttingDown = false;

app.get('/', (_req, res) => {
  res.status(200).send('✅ VerifiedModels Bot online');
});

// Render usa este endpoint para el health check.
// Debe ser rápido y no depender de Firebase ni de Telegram.
app.get('/health', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'verifiedmodels-bot',
    status: shuttingDown ? 'shutting_down' : 'online',
    bot: botStarted ? 'running' : 'starting'
  });
});

// Endpoint adicional para comprobar que el bot terminó de iniciar.
app.get('/ready', (_req, res) => {
  if (!botStarted || shuttingDown) {
    return res.status(503).json({
      ok: false,
      service: 'verifiedmodels-bot',
      bot: botStarted ? 'stopping' : 'starting'
    });
  }

  return res.status(200).json({
    ok: true,
    service: 'verifiedmodels-bot',
    bot: 'running'
  });
});

const server = app.listen(PORT, HOST, async () => {
  console.log(`🌐 HTTP escuchando en ${HOST}:${PORT}`);
  console.log('🔎 Render health check: /health');

  try {
    await bot.launch({ dropPendingUpdates: true });
    botStarted = true;
    console.log('✅ BOT VERIFIEDMODELS INICIADO');
  } catch (error) {
    console.error('❌ Error al iniciar bot:', error);
    process.exit(1);
  }
});

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`🛑 Recibido ${signal}. Cerrando bot y servidor...`);

  try {
    bot.stop(signal);
  } catch (error) {
    console.error('⚠️ Error deteniendo Telegram:', error);
  }

  server.close(() => {
    console.log('✅ Servidor HTTP cerrado correctamente');
    process.exit(0);
  });

  // Evita que un deploy/restart quede bloqueado indefinidamente.
  setTimeout(() => process.exit(0), 10000).unref();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
  shutdown('UNCAUGHT_EXCEPTION');
});
