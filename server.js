require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { bot } = require('./src/bot');
const { isAdmin } = require('./src/utils');

const app = express();
app.disable('x-powered-by');
app.use(cors({
  origin: process.env.WEBAPP_URL ? [process.env.WEBAPP_URL] : true
}));
app.use(express.json({ limit: '100kb' }));

app.get('/', (_req, res) => {
  res.send('✅ VerifiedModels Bot online');
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'verifiedmodels-bot' });
});

app.post('/api/aviso', async (req, res) => {
  try {
    const secret = process.env.API_SECRET;
    if (!secret || req.get('x-api-secret') !== secret) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const { tipo, modelo, usuario, comentario, voto } = req.body || {};
    const canalId = process.env.CANAL_ID;

    if (!canalId) {
      return res.status(500).json({ ok: false, error: 'CANAL_ID no configurado' });
    }

    const esc = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    let msg = '';
    if (tipo === 'comentario') {
      msg = [
        '💬 <b>NUEVO COMENTARIO</b>',
        '',
        `👸🏻 Modelo: <b>${esc(modelo)}</b>`,
        `👤 Usuario: ${esc(usuario)}`,
        `💭 Dice: ${esc(comentario)}`
      ].join('\n');
    } else if (tipo === 'voto') {
      const score = Number(voto);
      if (!Number.isInteger(score) || score < 1 || score > 5) {
        return res.status(400).json({ ok: false, error: 'Voto inválido' });
      }
      msg = [
        '⭐ <b>NUEVO VOTO</b>',
        '',
        `👸🏻 Modelo: <b>${esc(modelo)}</b>`,
        `👤 Usuario: ${esc(usuario)}`,
        `⭐ Voto: ${score}/5`
      ].join('\n');
    } else {
      return res.status(400).json({ ok: false, error: 'Tipo inválido' });
    }

    if (process.env.WEBAPP_URL) {
      msg += `\n\n🔗 <a href="${esc(process.env.WEBAPP_URL)}">Abrir WebApp</a>`;
    }

    await bot.telegram.sendMessage(canalId, msg, { parse_mode: 'HTML' });
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error /api/aviso:', error);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

const PORT = Number(process.env.PORT) || 10000;
const server = app.listen(PORT, () => {
  console.log(`🌐 HTTP escuchando en ${PORT}`);
  iniciarBot();
});

let starting = false;

async function iniciarBot() {
  if (starting) return;
  starting = true;

  try {
    await bot.launch({ dropPendingUpdates: true });
    console.log('✅ BOT VERIFIEDMODELS INICIADO');
  } catch (error) {
    console.error('❌ Error al iniciar bot:', error);
    process.exit(1);
  }
}

function shutdown(signal) {
  console.log(`🛑 Cerrando por ${signal}`);
  bot.stop(signal);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 5000).unref();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
