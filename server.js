const express = require('express');
const { bot } = require('./src/bot');
require('./src/handlers');

const app = express();
app.use(express.json());
app.get('/', (req,res)=> res.send('Bot V14 MODULAR 13 FUNCIONES OK'));
app.post('/webhook', (req,res)=>{ bot.handleUpdate(req.body).then(()=>res.send('ok')).catch(()=>res.send('ok')); });
const PORT = process.env.PORT||3000;
app.listen(PORT, async()=>{
  console.log('V14 Modular Live');
  const ext = process.env.RENDER_EXTERNAL_URL;
  if(ext){ try{ await bot.telegram.setWebhook(`${ext}/webhook`); console.log('Webhook OK'); }catch(e){ console.log('Webhook error', e.message); } }
});
