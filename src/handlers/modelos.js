const { getModelos,voteModelo }=require('../config/db');
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
  bot.action(/^voto_(bueno|malo):(.+)$/,async ctx=>{
    try{
      const type=ctx.match[1],id=ctx.match[2];
      const n=await voteModelo(id,type);
      await ctx.answerCbQuery(type==='bueno'?'👍 Voto registrado':'👎 Voto registrado');
      return ctx.reply((type==='bueno'?'👍':'👎')+' Voto registrado. Total de este tipo: '+n);
    }catch(e){console.error('Error voto bot:',e);return ctx.answerCbQuery('No se pudo registrar el voto',{show_alert:true});}
  });
};