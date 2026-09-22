const { saveUser,getConfig,getBotMedia }=require('../config/db');
const { replaceVars }=require('../utils');
const { Markup }=require('telegraf');
const { webAppButton,urlButton,button }=require('../buttons');

module.exports=bot=>bot.start(async ctx=>{
  await saveUser(ctx.from.id,{username:ctx.from.username||'',first_name:ctx.from.first_name||'',last_name:ctx.from.last_name||''});
  const c=await getConfig(),m=await getBotMedia(),t=replaceVars(c.bienvenida_texto||'👋 ¡Hola {mencion}! 💎\n\nBienvenid@ a VerifiedModels ✨',ctx);
  const rows=[[await webAppButton('webapp',process.env.WEBAPP_URL||''),await button('modelos')]];
  if(process.env.CANAL_FREE_URL)rows.push([await urlButton('canal_free',process.env.CANAL_FREE_URL)]);
  const kb=Markup.inlineKeyboard(rows);
  if(m.bienvenida)return ctx.replyWithPhoto(m.bienvenida,{caption:t,parse_mode:'HTML',...kb});
  return ctx.reply(t,{parse_mode:'HTML',...kb});
});