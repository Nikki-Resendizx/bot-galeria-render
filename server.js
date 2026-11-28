require('dotenv').config();

const express = require('express');
const crypto = require('crypto');
const { bot } = require('./src/bot');
const { getTopic } = require('./src/storage');

const app = express();
app.disable('x-powered-by');

const PORT = Number(process.env.PORT) || 10000;

app.use(express.json({ limit: '32kb' }));

function verifyTelegramWebAppInitData(initData) {
  if (typeof initData !== 'string' || !initData || !process.env.BOT_TOKEN) return null;
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  const authDate = Number(params.get('auth_date'));
  if (!receivedHash || !Number.isFinite(authDate)) return null;
  if (Math.abs(Math.floor(Date.now() / 1000) - authDate) > 86400) return null;

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, value]) => key + '=' + value)
    .join('\\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData')
    .update(process.env.BOT_TOKEN)
    .digest();
  const calculatedHash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const expected = Buffer.from(calculatedHash, 'hex');
  const received = Buffer.from(receivedHash, 'hex');
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

  try {
    const user = JSON.parse(params.get('user') || 'null');
    return user && user.id ? user : null;
  } catch (_) {
    return null;
  }
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  })[char]);
}

app.post('/api/webapp/visit', async (req, res) => {
  try {
    const user = verifyTelegramWebAppInitData(req.body?.initData);
    if (!user) return res.status(401).json({ ok: false, error: 'Telegram initData no válido o vencido' });

    const topic = await getTopic('usuarios');
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Sin nombre';
    const username = user.username ? '@' + user.username : 'Sin username';
    const language = user.language_code || 'No disponible';
    const premium = user.is_premium ? 'Sí' : 'No';
    const enteredAt = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date());

    const message = [
      '🌐 <b>NUEVA ENTRADA A LA WEBAPP</b>',
      '',
      '👤 <b>Usuario:</b> ' + escapeHtml(fullName),
      '🔗 <b>Username:</b> ' + escapeHtml(username),
      '🆔 <b>ID:</b> <code>' + escapeHtml(user.id) + '</code>',
      '🌍 <b>Idioma:</b> ' + escapeHtml(language),
      '⭐ <b>Telegram Premium:</b> ' + premium,
      '🕒 <b>Entrada:</b> ' + escapeHtml(enteredAt),
      '',
      '📍 <b>Sección:</b> Galería VerifiedModels'
    ].join('\\n');

    await bot.telegram.sendMessage(topic.groupId, message, {
      message_thread_id: topic.threadId,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('WEBAPP VISIT: no se pudo registrar la entrada:', error);
    return res.status(503).json({ ok: false, error: 'No se pudo registrar la entrada' });
  }
});
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
