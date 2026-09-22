const { getConfig } = require('../cache');
const { replaceVars } = require('../utils');
module.exports = (bot)=>{
  bot.start(async(ctx)=>{
    try{
      const c = await getConfig();
      let txt = replaceVars(c.bienvenida_texto, ctx);
      const btns = c.botones?.bienvenida || {};
      const kb = [
        [{text: (btns.galeria_virtual?.text||"💖 VIRTUAL GALERIA 💖"), web_app:{url:process.env.WEBAPP_URL||"https://google.com"}}],
        [{text: (btns.lista_modelos?.text||"👑 LISTA MODELOS 👑"), callback_data:"ver_modelos"}],
        [{text: (btns.canal_oficial?.text||"💎 CANAL OFICIAL 💎"), url:process.env.CANAL_OFICIAL||"https://t.me/"}]
      ];
      if(c.bienvenida_media){
        try{ return await ctx.replyWithPhoto(c.bienvenida_media,{caption:txt,parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); }catch(e){}
      }
      await ctx.reply(txt,{parse_mode:'HTML',reply_markup:{inline_keyboard:kb}});
    }catch(e){ await ctx.reply("Hola 💖 Bienvenid@"); }
  });
};
