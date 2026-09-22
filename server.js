require('dotenv').config();
const express = require('express');
const { bot } = require('./src/bot');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req,res)=> res.send(`✅ V16.1 PREMIUM - WebApp: ${process.env.WEBAPP_URL}`));
app.get('/health', (req,res)=> res.json({ok:true, v:'16.1'}));

app.post('/api/aviso', async (req,res)=>{
  try{
    const { tipo, modelo, usuario, comentario, voto } = req.body;
    const canalId = process.env.CANAL_ID || '-1004377732507';
    let msg = '';
    if(tipo === 'comentario'){
      msg = `💬 <b>NUEVO COMENTARIO</b> 💬\n\n👸🏻 Modelo: <b>${modelo}</b>\n👤 Usuario: ${usuario}\n💭 Dice: ${comentario}\n\n🔗 <a href="${process.env.WEBAPP_URL}">Ver en WebApp</a>`;
    }else if(tipo === 'voto'){
      msg = `⭐ <b>NUEVO VOTO</b> ⭐\n\n👸🏻 Modelo: <b>${modelo}</b>\n👤 Usuario: ${usuario}\n⭐ Voto: ${voto}/5`;
    }
    if(canalId && msg){
      await bot.telegram.sendMessage(canalId, msg, {parse_mode:'HTML'});
    }
    res.json({ok:true});
  }catch(e){
    console.log("Error aviso", e.message);
    res.json({ok:false});
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>{ console.log(`🌐 Web en ${PORT}`); iniciarBot(); });

async function iniciarBot(i=0){
  try{
    await bot.telegram.deleteWebhook({drop_pending_updates:true}).catch(()=>{});
    await new Promise(r=>setTimeout(r,3000+i*2000));
    await bot.launch({dropPendingUpdates:true});
    console.log("✅ BOT V16.1 CON AVISOS INICIADO");
  }catch(e){
    if(e.message.includes('409') && i<10) setTimeout(()=>iniciarBot(i+1),5000);
    else setTimeout(()=>process.exit(1),10000);
  }
}
process.once('SIGINT',()=>bot.stop('SIGINT'));
process.once('SIGTERM',()=>bot.stop('SIGTERM'));
