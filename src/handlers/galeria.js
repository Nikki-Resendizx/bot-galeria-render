const { getBotMedia }=require('../config/db');
const { Markup }=require('telegraf');
const { webAppButton }=require('../buttons');
module.exports=bot=>bot.command('galeria',async ctx=>{
  const m=await getBotMedia();
  const kb=Markup.inlineKeyboard([[await webAppButton('webapp',process.env.WEBAPP_URL||'')]]);
  if(m.galeria)return ctx.replyWithPhoto(m.galeria,{caption:'🖼️ <b>GALERÍA VIRTUAL</b> 💎',parse_mode:'HTML',...kb});
  return ctx.reply('🖼️ <b>GALERÍA VIRTUAL</b> 💎',{parse_mode:'HTML',...kb});
});