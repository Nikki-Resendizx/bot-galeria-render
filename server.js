require('dotenv').config();
const express = require('express');
const { bot } = require('./src/bot');

const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('✅ Bot Galeria Live v15 - 🔵🔴 FIX 409');
});

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Web server en ${PORT}`);
  console.log(`>>> Available at your primary URL https://bot-galeria-render.onrender.com`);
  console.log(`>>> Your service is live 🎉`);
  
  iniciarBot();
});

async function iniciarBot(intentos = 0) {
  const MAX_INTENTOS = 10;
  
  try {
    console.log(`[y0mr] Intentando iniciar bot... intento ${intentos + 1}/${MAX_INTENTOS}`);
    
    // 1. Matar cualquier webhook que quede
    try {
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      console.log("[y0mr] Webhook borrado");
    } catch(e) {
      console.log("[y0mr] No había webhook que borrar");
    }
    
    // 2. Esperar para que Telegram libere la sesión
    const espera = intentos === 0 ? 3000 : 5000 + (intentos * 2000);
    console.log(`[y0mr] Esperando ${espera/1000}s para liberar Telegram...`);
    await new Promise(r => setTimeout(r, espera));
    
    // 3. Launch
    await bot.launch({ 
      dropPendingUpdates: true,
      allowedUpdates: ['message','callback_query','my_chat_member'] 
    });
    
    console.log("✅ Bot iniciado - v15 estable sin 409");
    
  } catch (e) {
    console.error(`❌ Error bot.launch: ${e.message}`);
    
    if (e.message.includes('409') && intentos < MAX_INTENTOS) {
      console.log(`[y0mr] 🔄 Reintentando en 5s... (409 detectado)`);
      setTimeout(() => iniciarBot(intentos + 1), 5000);
    } else if (intentos >= MAX_INTENTOS) {
      console.error("💀 Max intentos alcanzado, reiniciando proceso en 30s...");
      setTimeout(() => process.exit(1), 30000); // Render lo reinicia solo
    } else {
      console.error("Error no es 409:", e);
    }
  }
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Evitar que Render mate el proceso por error no capturado
process.on('unhandledRejection', (reason) => {
  console.log("Unhandled Rejection:", reason);
});
