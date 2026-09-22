const { bot } = require('../bot');
const { getConfig } = require('../cache');
const { replaceVars } = require('../utils');
const { WEBAPP_URL, CANAL_OFICIAL } = require('../config');
const { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, increment } = require('firebase/firestore');
const { db } = require('../firebase');

bot.action('lista', async(ctx)=>{
  await ctx.answerCbQuery().catch(()=>{});
  try{ await ctx.deleteMessage().catch(()=>{}); }catch(e){}

  let c = await getConfig();
  let texto = replaceVars(c.galeria_texto||"👑 GALERIA {mencion}\nElige una chica 👇", {}, ctx);
  let entities = c.galeria_entities || [];
  let snap = await getDocs(query(collection(db,"modelos"), orderBy("fecha","desc")));
  if(snap.empty){ await ctx.reply("⏳ Aún no hay modelos"); return; }

  let keyboard=[];
  let row=[];
  let snapArray = [];
  snap.forEach(d=> snapArray.push(d));

  snapArray.forEach((d, index)=>{
    let m = d.data();
    let color = (index % 2 === 0)? "primary" : "danger"; // par=azul, impar=rojo

    let btn = {
      text: `${m.perfil}`,
      callback_data: `ver_${d.id}`,
      style: color
    };
    if(c.galeria_emoji_premium){
      btn.icon_custom_emoji_id = c.galeria_emoji_premium;
    }
    row.push(btn);
    if(row.length===2){
      keyboard.push(row);
      row=[];
    }
  });
  if(row.length>0) keyboard.push(row);

  let canalConf = c.botones?.galeria?.canal_oficial || {};
  let galeriaConf = c.botones?.galeria?.galeria_virtual || {};

  keyboard.push([{
    text: canalConf.text || "CANAL OFICIAL",
    url: canalConf.url || CANAL_OFICIAL,
    style: canalConf.color || "primary",
   ...(canalConf.premiumId? { icon_custom_emoji_id: canalConf.premiumId } : {})
  }]);

  keyboard.push([{
    text: galeriaConf.text || "ABRIR GALERÍA WEB",
    web_app: { url: WEBAPP_URL },
    style: galeriaConf.color || "success",
   ...(galeriaConf.premiumId? { icon_custom_emoji_id: galeriaConf.premiumId } : {})
  }]);

  keyboard.push([{ text:"🏠 Inicio", callback_data:"inicio", style:"primary" }]);

  if(c.galeria_media){
    try{
      await ctx.replyWithPhoto(c.galeria_media, { caption:texto, caption_entities:entities, reply_markup:{ inline_keyboard: keyboard } });
      return;
    }catch(e){ console.log("Foto error", e.message); }
  }
  await ctx.reply(texto, { entities, reply_markup:{ inline_keyboard: keyboard } });
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
    [{ text: b.perfil_completo?.text||"VER PERFIL COMPLETO", web_app:{url:`${WEBAPP_URL}/perfil.html?id=${id}`}, style: b.perfil_completo?.color||"primary",...(b.perfil_completo?.premiumId?{icon_custom_emoji_id:b.perfil_completo.premiumId}:{}) }],
    [{ text: b.bueno?.text||"Bueno", callback_data:`voto_bueno_${id}`, style: b.bueno?.color||"success" }, { text: b.malo?.text||"Malo", callback_data:`voto_malo_${id}`, style: b.malo?.color||"danger" }],
    [{ text: b.canal_free?.text||"CANAL FREE", url: m.canalFree||CANAL_OFICIAL, style: b.canal_free?.color||"primary" }, { text: b.contactame?.text||"CONTACTAME", url: m.contacto||CANAL_OFICIAL, style: b.contactame?.color||"primary" }],
    [{ text: b.volver?.text||"VOLVER", callback_data:"lista", style:"primary" }, { text: b.inicio?.text||"INICIO", callback_data:"inicio", style:"primary" }]
  ];

  if(m.fotos&&m.fotos.length>0){
    try{
      let mediaGroup=m.fotos.slice(0,10).map((f,i)=>({ type:'photo', media:f, caption: i===0?texto:undefined, caption_entities: i===0?entities:undefined }));
      await ctx.replyWithMediaGroup(mediaGroup);
      await ctx.reply("👇", { reply_markup:{inline_keyboard:kb} });
      return;
    }catch(e){ console.log(e.message); }
  }
  await ctx.reply(texto, { entities, reply_markup:{inline_keyboard:kb} });
});

bot.action(/voto_(bueno|malo)_(.*)/, async(ctx)=>{
  await ctx.answerCbQuery("✅ Voto registrado").catch(()=>{});
  let tipo=ctx.match[1]; let id=ctx.match[2];
  try{ await updateDoc(doc(db,"modelos",id), tipo==='bueno'?{votosBueno:increment(1)}:{votosMalo:increment(1)}); }catch(e){}
});
