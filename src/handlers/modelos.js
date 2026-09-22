const { getModelos }=require('../config/db');
const { escapeHtml }=require('../utils');
const { Markup }=require('telegraf');
const { button,urlButton }=require('../buttons');

async function send(ctx){
  const list=await getModelos();
  if(!list.length)return ctx.reply('😔 Aún no hay modelos disponibles.');
  for(const m of list){
    const total=Number(m.votosBueno||0)+Number(m.votosMalo||0);
    const c=['👸🏻 <b>'+escapeHtml(m.perfil||m.username||'Modelo')+'</b>','',m.descripcion?escapeHtml(m.descripcion):'','🎂 '+escapeHtml(m.edad??'')+'  🌎 '+escapeHtml(m.nacionalidad||''),'💎 '+escapeHtml(m.servicios||''),'👍 '+Number(m.votosBueno||0)+'  👎 '+Number(m.votosMalo||0)+'  • '+total+' votos'].filter(Boolean).join('\n');
    const kb=Markup.inlineKeyboard([[await button('bueno',{callback_data:'voto_bueno:'+m.id}),await button('malo',{callback_data:'voto_malo:'+m.id})]]);
    try{
      if(m.foto&&/^https?:\/\//i.test(String(m.foto)))await ctx.replyWithPhoto(m.foto,{caption:c,parse_mode:'HTML',...kb});
      else await ctx.reply(c,{parse_mode:'HTML',...kb});
    }catch(e){await ctx.reply(c,{parse_mode:'HTML',...kb});}
  }
}
module.exports=bot=>{
  bot.command('modelos',send);
  bot.action('public_modelos',async ctx=>{await ctx.answerCbQuery();await send(ctx);});
};