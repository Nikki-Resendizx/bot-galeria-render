require('dotenv').config();
const express=require('express');
const { bot }=require('./src/bot');
const app=express();
app.disable('x-powered-by');
app.get('/',(q,r)=>r.send('✅ VerifiedModels Bot online'));
app.get('/health',(q,r)=>r.json({ok:true,service:'verifiedmodels-bot'}));
const PORT=Number(process.env.PORT)||10000;
const server=app.listen(PORT,async()=>{
  console.log('🌐 HTTP escuchando en '+PORT);
  try{await bot.launch({dropPendingUpdates:true});console.log('✅ BOT VERIFIEDMODELS INICIADO');}
  catch(e){console.error('❌ Error al iniciar bot:',e);process.exit(1);}
});
function shutdown(s){bot.stop(s);server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),5000).unref();}
process.once('SIGINT',()=>shutdown('SIGINT'));process.once('SIGTERM',()=>shutdown('SIGTERM'));