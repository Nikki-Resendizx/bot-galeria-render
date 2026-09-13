const { bot } = require('../bot');
const { getConfig, getModelos } = require('../cache');
const { replaceVars } = require('../utils');
const { WEBAPP_URL, CANAL_OFICIAL } = require('../config');
const { doc, getDoc, updateDoc, increment } = require('firebase/firestore');
const { db } = require('../firebase');

function buildBtn(conf, fallbackText, fallbackUrl = null){
  if(!conf) return { text: fallbackText, url: fallbackUrl };
  // conf = { text, color, premiumId, entities, url }
  let txt = conf.text || fallbackText;
  let color = conf.color || '';
  // Evita duplicar color si ya lo trae el texto
  let finalText = color? `${color} ${txt}`.trim() : txt;
  if(finalText.length > 64) finalText = finalText.slice(0,64);
  let btn = { text: finalText };
  if(conf.url || fallbackUrl) btn.url = conf.url || fallbackUrl;
  return btn;
}

bot.action('lista', async(ctx)=>{
  await ctx.answerCbQuery().catch(()=>{});
  try{ await ctx.deleteMessage().catch(()=>{}); }catch(e){}
  let config = await getConfig();
  let snap = await getModelos();
  if(snap.size===0){ await ctx.reply("⏳ Aún no hay modelos"); return; }

  let botonesConf = config.botones?.galeria||{};
  let texto = replaceVars(config.galeria_texto||"👑 GALERÍA {mencion} 👑\n\nElige una diosa:", {}, ctx);
  let entities = config.galeria_entities||[];

  // COLORES #r #g #p
  let c1 = botonesConf.modelo_color_1 || botonesConf.modelo_style_1?.color || "🔵";
  let c2 = botonesConf.modelo_color_2 || botonesConf.modelo_style_2?.color || "🔴";
  // Si guardaste con sintaxis, viene como objeto {color: "🟢"}
  if(typeof c1 === 'object') c1 = c1.color || "🔵";
  if(typeof c2 === 'object') c2 = c2.color || "🔴";

  let kb=[]; let row=[]; let i=0;
  snap.forEach(d=>{
    let m=d.data();
    let color = (i%2===0)? c1 : c2;
    // Perfil con color asignado
    let btnText = `${color} ${m.perfil}`.slice(0,64);
    row.push({ text: btnText, callback_data:`ver_${d.id}` });
    if(row.length===2){ kb.push(row); row=[]; }
    i++;
  });
  if(row.length) kb.push(row);

  // BOTONES CON SINTAXIS #g 💎 CANAL OFICIAL
  let btnCanal = buildBtn(botonesConf.canal_oficial, "💎 CANAL OFICIAL 💎", botonesConf.canal_oficial?.url || CANAL_OFICIAL);
  let btnGaleria = buildBtn(botonesConf.galeria_virtual, "💖 VER GALERÍA VIRTUAL 💖");
  btnGaleria.web_app = { url: WEBAPP_URL };
  if(btnGaleria.url) delete btnGaleria.url;

  kb.push([btnCanal]);
  kb.push([btnGaleria]);

  if(config.galeria_media){
    try{ await ctx.replyWithPhoto(config.galeria_media, { caption:texto, caption_entities:entities, parse_mode:'HTML', reply_markup:{inline_keyboard:kb} }); return; }catch(e){ console.log("Foto galeria fail", e.message); }
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

  let btnPerfil = buildBtn(b.perfil_completo, "💖 VER PERFIL COMPLETO 💖");
  btnPerfil.web_app = { url: `${WEBAPP_URL}/perfil.html?id=${id}` };
  if(btnPerfil.url) delete btnPerfil.url;

  let btnBueno = buildBtn(b.bueno, "👍🏻 Bueno");
  btnBueno.callback_data = `voto_bueno_${id}`;
  if(btnBueno.url) delete btnBueno.url;

  let btnMalo = buildBtn(b.malo, "👎🏻 Malo");
  btnMalo.callback_data = `voto_malo_${id}`;
  if(btnMalo.url) delete btnMalo.url;

  let btnFree = buildBtn(b.canal_free, "CANAL FREE", m.canalFree||CANAL_OFICIAL);
  let btnContacto = buildBtn(b.contactame, "CONTACTAME", m.contacto||CANAL_OFICIAL);
  let btnVolver = buildBtn(b.volver, "VOLVER");
  btnVolver.callback_data = "lista";
  if(btnVolver.url) delete btnVolver.url;
  let btnInicio = buildBtn(b.inicio, "INICIO");
  btnInicio.callback_data = "inicio";
  if(btnInicio.url) delete btnInicio.url;

  let kb=[
    [btnPerfil],
    [btnBueno, btnMalo],
    [btnFree, btnContacto],
    [btnVolver, btnInicio]
  ];

  if(m.fotos&&m.fotos.length>0){
    try{
      let mediaGroup=m.fotos.slice(0,10).map((f,i)=>({ type:'photo', media:f, caption: i===0?texto:undefined, caption_entities: i===0?entities:undefined, parse_mode:i===0?'HTML':undefined }));
      await ctx.replyWithMediaGroup(mediaGroup);
      await ctx.reply("👇", { reply_markup:{inline_keyboard:kb} });
      return;
    }catch(e){ console.log(e.message); }
  }
  await ctx.reply(texto, { entities, parse_mode:'HTML', reply_markup:{inline_keyboard:kb} });
});

bot.action(/voto_(bueno|malo)_(.*)/, async(ctx)=>{
  await ctx.answerCbQuery("✅ Voto registrado").catch(()=>{});
  let tipo=ctx.match[1]; let id=ctx.match[2];
  try{ await updateDoc(doc(db,"modelos",id), tipo==='bueno'?{votosBueno:increment(1)}:{votosMalo:increment(1)}); }catch(e){}
});
