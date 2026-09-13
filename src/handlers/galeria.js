const { bot } = require('../bot');
const { getConfig, getModelos } = require('../cache');
const { replaceVars } = require('../utils');
const { WEBAPP_URL, CANAL_OFICIAL } = require('../config');
const { doc, getDoc, updateDoc, increment } = require('firebase/firestore');
const { db } = require('../firebase');

bot.action('lista', async(ctx)=>{
  await ctx.answerCbQuery().catch(()=>{});
  try{ await ctx.deleteMessage().catch(()=>{}); }catch(e){}
  let config = await getConfig();
  let snap = await getModelos();
  if(snap.size===0){ await ctx.reply("⏳ Aún no hay modelos"); return; }

  let botonesConf = config.botones?.galeria||{};
  let texto = replaceVars(config.galeria_texto||"👑 GALERÍA {mencion} 👑\n\nElige una diosa:", {}, ctx);
  let entities = config.galeria_entities||[];

  let kb=[]; let row=[]; let i=0;
  snap.forEach(d=>{
    let m=d.data();
    let styleKey = `modelo_style_${(i%2)+1}`;
    let colorKey = `modelo_color_${(i%2)+1}`;
    let color = botonesConf[colorKey]||(i%2===0?"🔵":"🔴");
    row.push({ text:`${color} ${m.perfil}`, callback_data:`ver_${d.id}` });
    if(row.length===2){ kb.push(row); row=[]; }
    i++;
  });
  if(row.length) kb.push(row);
  kb.push([{ text: botonesConf.canal_oficial?.text||"💎 CANAL OFICIAL 💎", url: botonesConf.canal_oficial?.url||CANAL_OFICIAL }]);
  kb.push([{ text: botonesConf.galeria_virtual?.text||"💖 VER GALERÍA VIRTUAL 💖", web_app:{url:WEBAPP_URL} }]);

  if(config.galeria_media){
    try{ await ctx.replyWithPhoto(config.galeria_media, { caption:texto, caption_entities:entities, parse_mode:'HTML', reply_markup:{inline_keyboard:kb} }); return; }catch(e){}
  }
  await ctx.reply(texto, { entities, parse_mode:'HTML', reply_markup:{inline_keyboard:kb} });
});

bot.action(/ver_(.*)/, async(ctx)=>{
  await ctx.answerCbQuery().catch(()=>{});
  try{ await ctx.deleteMessage().catch(()=>{}); }catch(e){}
  let id=ctx.match[1];
  let snap=await getDoc(doc(db,"modelos",id));
  if(!snap.exists()){ await ctx.reply("❌ Modelo no existe"); return; }
  let m=snap.data();
  let config=await getConfig();
  let plantilla=config.plantilla_texto||"👑 {perfil} 👑\n@{username}\n{edad} | {nacionalidad}\n\n{Lista_servicios}\n\n{descripcion}\n\n{Votos} votos | {porcentaje_buenos}% buenos";
  let texto=replaceVars(plantilla, m, ctx);
  let entities=config.plantilla_entities||[];
  let b=config.botones?.plantilla||{};

  let kb=[
    [{ text: b.perfil_completo?.text||"💖 VER PERFIL COMPLETO 💖", web_app:{url:`${WEBAPP_URL}/perfil.html?id=${id}`} }],
    [{ text: b.bueno?.text||"👍🏻 Bueno", callback_data:`voto_bueno_${id}` }, { text: b.malo?.text||"👎🏻 Malo", callback_data:`voto_malo_${id}` }],
    [{ text: b.canal_free?.text||"CANAL FREE", url: m.canalFree||CANAL_OFICIAL }, { text: b.contactame?.text||"CONTACTAME", url: m.contacto||CANAL_OFICIAL }],
    [{ text: b.volver?.text||"VOLVER", callback_data:"lista" }, { text: b.inicio?.text||"INICIO", callback_data:"inicio" }]
  ];

  if(m.fotos&&m.fotos.length>0){
    try{
      let mediaGroup=m.fotos.slice(0,10).map((f,i)=>({ type:'photo', media:f, caption: i===0?texto:undefined, caption_entities: i===0?entities:undefined, parse_mode:i===0?'HTML':undefined }));
      await ctx.replyWithMediaGroup(mediaGroup);
      await ctx.reply("👇", { reply_markup:{inline_keyboard:kb} });
      return;
    }catch(e){}
  }
  await ctx.reply(texto, { entities, parse_mode:'HTML', reply_markup:{inline_keyboard:kb} });
});

bot.action(/voto_(bueno|malo)_(.*)/, async(ctx)=>{
  await ctx.answerCbQuery("✅ Voto registrado").catch(()=>{});
  let tipo=ctx.match[1]; let id=ctx.match[2];
  try{ await updateDoc(doc(db,"modelos",id), tipo==='bueno'?{votosBueno:increment(1)}:{votosMalo:increment(1)}); }catch(e){}
});
