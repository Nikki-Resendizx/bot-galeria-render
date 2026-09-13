const { bot } = require('../bot');
const { getConfig } = require('../cache');
const { getMencion, replaceVars } = require('../utils');
const { WEBAPP_URL, CANAL_OFICIAL } = require('../config');

bot.start(async (ctx)=>{
  try{
    let config = await getConfig();
    let texto = replaceVars(config.bienvenida_texto||"Hola {mencion} 👑 Bienvenida a Verified Models", {}, ctx);
    let entities = config.bienvenida_entities||[];
    let botones = config.botones?.bienvenida||{};

    let kb = [
      [{ text: botones.galeria_virtual?.text||"💖 VER GALERÍA VIRTUAL 💖", web_app:{url:WEBAPP_URL} }],
      [{ text: botones.lista_modelos?.text||"👑 VER LISTA DE MODELOS 👑", callback_data:"lista" }],
      [{ text: botones.canal_oficial?.text||"💎 CANAL OFICIAL 💎", url: botones.canal_oficial?.url||CANAL_OFICIAL }]
    ];

    if(config.bienvenida_media){
      try{
        await ctx.replyWithPhoto(config.bienvenida_media, { caption:texto, caption_entities:entities, parse_mode:'HTML', reply_markup:{inline_keyboard:kb} });
        return;
      }catch(e){}
    }
    await ctx.reply(texto, { entities, parse_mode:'HTML', reply_markup:{inline_keyboard:kb} });
  }catch(e){ console.log(e); }
});

bot.action('inicio', async(ctx)=>{
  await ctx.answerCbQuery().catch(()=>{});
  try{ await ctx.deleteMessage().catch(()=>{}); }catch(e){}
  let config = await getConfig();
  let texto = replaceVars(config.bienvenida_texto||"Hola {mencion} 👑", {}, ctx);
  let entities = config.bienvenida_entities||[];
  let botones = config.botones?.bienvenida||{};
  let kb = [
    [{ text: botones.galeria_virtual?.text||"💖 VER GALERÍA VIRTUAL 💖", web_app:{url:WEBAPP_URL} }],
    [{ text: botones.lista_modelos?.text||"👑 VER LISTA DE MODELOS 👑", callback_data:"lista" }],
    [{ text: botones.canal_oficial?.text||"💎 CANAL OFICIAL 💎", url: botones.canal_oficial?.url||CANAL_OFICIAL }]
  ];
  if(config.bienvenida_media){
    try{ await ctx.replyWithPhoto(config.bienvenida_media, { caption:texto, caption_entities:entities, parse_mode:'HTML', reply_markup:{inline_keyboard:kb} }); return; }catch(e){}
  }
  await ctx.reply(texto, { entities, parse_mode:'HTML', reply_markup:{inline_keyboard:kb} });
});
