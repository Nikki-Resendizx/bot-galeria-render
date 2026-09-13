const express = require('express');
const { Telegraf } = require('telegraf');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, collection, getDocs, increment, updateDoc, deleteDoc } = require('firebase/firestore');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = "https://galeria-verifiedmodels.pages.dev";
const CANAL_OFICIAL = "http://t.me/VerifiedModels_VIP";
const ADMIN_IDS_ENV = (process.env.ADMIN_IDS || "").split(",").map(s=>s.trim()).filter(Boolean);

if (!getApps().length) {
  initializeApp({ apiKey:"AIzaSyAIHevrpglvhHK3IsxpnkHlWpxnuf5o1So",authDomain:"galeria-verifiedmodels.firebaseapp.com",projectId:"galeria-verifiedmodels",storageBucket:"galeria-verifiedmodels.firebasestorage.app",messagingSenderId:"684551560793",appId:"1:684551560793:web:3730a07d8d6ec737e3db48"});
}
const db=getFirestore();
const bot = new Telegraf(BOT_TOKEN);

let cache={config:null,time:0,modelos:null,mtime:0};
const CACHE_MS=5*60*1000;

const DEFAULT_BOTONES = {
  bienvenida: {
    galeria_virtual: { text:"💖 VER GALERÍA VIRTUAL 💖", style:"primary", type:"webapp" },
    lista_modelos: { text:"👑 VER LISTA DE MODELOS 👑", style:"danger", type:"callback", data:"lista" },
    canal_oficial: { text:"💎 CANAL OFICIAL 💎", style:"success", type:"url", url:CANAL_OFICIAL }
  },
  galeria: {
    modelo_style_1: "primary", modelo_style_2: "danger",
    modelo_color_1: "🔵", modelo_color_2: "🔴",
    canal_oficial: { text:"💎 CANAL OFICIAL 💎", style:"success", url:CANAL_OFICIAL },
    galeria_virtual: { text:"💖 VER GALERÍA VIRTUAL 💖", style:"primary", type:"webapp" }
  },
  plantilla: {
    perfil_completo: { text:"💖 VER PERFIL COMPLETO 💖", style:"primary", type:"webapp" },
    bueno: { text:"👍 Bueno", style:"success", type:"voto" },
    malo: { text:"👎 Malo", style:"danger", type:"voto" },
    canal_free: { text:"💎 CANAL FREE", style:"primary", type:"url" },
    contactame: { text:"💬 CONTACTAME", style:"primary", type:"url" },
    volver: { text:"👈 VOLVER", style:"danger", type:"callback", data:"lista" },
    inicio: { text:"👑 INICIO", style:"danger", type:"callback", data:"inicio" }
  }
};

async function getConfig(){
  if(cache.config && Date.now()-cache.time<CACHE_MS) return cache.config;
  try{
    let s=await getDoc(doc(db,"config","bot"));
    if(s.exists()){
      let data=s.data();
      data.botones = {...DEFAULT_BOTONES,...(data.botones||{}),
        bienvenida: {...DEFAULT_BOTONES.bienvenida,...(data.botones?.bienvenida||{}) },
        galeria: {...DEFAULT_BOTONES.galeria,...(data.botones?.galeria||{}) },
        plantilla: {...DEFAULT_BOTONES.plantilla,...(data.botones?.plantilla||{}) }
      };
      cache.config=data; cache.time=Date.now(); return data;
    }
  }catch(e){}
  return { bienvenida_texto:"Hola {mencion} 👑", bienvenida_entities:[], galeria_texto:"👑 GALERIA {mencion}", galeria_entities:[], plantilla_texto:"👑 {perfil} 👑\n@{username}\n{edad} | {nacionalidad}\n\n{Lista_servicios}\n\n{descripcion}\n\n{Votos} votos - {porcentaje_buenos}% buenos", plantilla_entities:[], bienvenida_media:null, galeria_media:null, admins:[], botones:DEFAULT_BOTONES };
}
async function getModelos(){
  if(cache.modelos && Date.now()-cache.mtime<CACHE_MS) return cache.modelos;
  try{ let snap=await getDocs(collection(db,"modelos")); cache.modelos=snap; cache.mtime=Date.now(); return snap; }catch(e){ return cache.modelos||{size:0,docs:[],forEach:()=>{}}; }
}
function clearCache(){ cache.config=null; cache.modelos=null; }
async function isAdmin(ctx){ let id=String(ctx.from?.id||""); if(ADMIN_IDS_ENV.includes(id)) return true; let c=await getConfig(); if(c.admins?.includes(id)) return true; if(ADMIN_IDS_ENV.length===0) return true; return false; }
function getMencion(ctx){ let n=(ctx.from.first_name||"").replace(/</g,'').replace(/>/g,''); return n?`<a href="tg://user?id=${ctx.from.id}">${n}</a>`:""; }
function replaceVars(str,m={},ctx=null){
  if(!str) return ""; let total=(m.votosMalo||0)+(m.votosBueno||0); let pBueno=total?Math.round((m.votosBueno||0)/total*100):0; let pMalo=total?Math.round((m.votosMalo||0)/total*100):0;
  let Lista_servicios=m.servicios?.map(s=>`• ${s}`).join('\n')||'• -'; let mencion=ctx?getMencion(ctx):"{mencion}";
  return str.replaceAll('{mencion}',mencion).replaceAll('{perfil}',m.perfil||'').replaceAll('@{username}',m.username?`@${m.username}`:'').replaceAll('{username}',m.username||'').replaceAll('{edad}',String(m.edad||'')).replaceAll('{nacionalidad}',m.nacionalidad||'').replaceAll('{Lista_servicios}',Lista_servicios).replaceAll('{lista_servicios}',Lista_servicios).replaceAll('{servicios}',Lista_servicios).replaceAll('{descripcion}',m.descripcion||'').replaceAll('{Votos}',String(total)).replaceAll('{votos}',String(total)).replaceAll('{porcentaje_buenos}%',`${pBueno}%`).replaceAll('{porcentaje_buenos}',String(pBueno)).replaceAll('{porcentaje_malos}%',`${pMalo}%`).replaceAll('{porcentaje_malos}',String(pMalo));
}

let esperando={}; let temp={};
const PANEL_TEXTO=`👑 <b>PANEL ADMIN</b> 👑`;

bot.start(async(ctx)=>{
  setDoc(doc(db,"usuarios",String(ctx.from.id)),{id:String(ctx.from.id)},{merge:true}).catch(()=>{});
  let c=await getConfig(); let texto=replaceVars(c.bienvenida_texto||"Hola {mencion}",{},ctx); let b=c.botones.bienvenida;
  let kb=[[{text:b.galeria_virtual.text, web_app:{url:WEBAPP_URL}, style:b.galeria_virtual.style}],[{text:b.lista_modelos.text, callback_data:"lista", style:b.lista_modelos.style}],[{text:b.canal_oficial.text, url:b.canal_oficial.url||CANAL_OFICIAL, style:b.canal_oficial.style}]];
  if(c.bienvenida_media){ try{ await ctx.replyWithPhoto(c.bienvenida_media,{caption:texto,parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); return; }catch(e){} }
  await ctx.reply(texto,{parse_mode:'HTML',reply_markup:{inline_keyboard:kb}});
});

bot.command('admin',async(ctx)=>{
  if(!(await isAdmin(ctx))) return ctx.reply("❌"); delete esperando[String(ctx.from.id)];
  await ctx.reply(PANEL_TEXTO,{parse_mode:'HTML',reply_markup:{inline_keyboard:[
    [{text:"👋 BIENVENIDA",callback_data:"panel_bienvenida", style:"danger"},{text:"📝 PLANTILLAS",callback_data:"panel_plantillas", style:"danger"}],
    [{text:"🖼️ GALERIA",callback_data:"panel_galeria", style:"primary"},{text:"👸 MODELOS",callback_data:"panel_modelos", style:"primary"}],
    [{text:"👑 ADMINS",callback_data:"panel_admins", style:"success"},{text:"🧩 BOTONES",callback_data:"panel_botones", style:"success"}]
  ]}});
});
bot.command('cancel',async(ctx)=>{ delete esperando[String(ctx.from.id)]; await ctx.reply("✅ Cancelado"); });

bot.action('panel_bienvenida',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); await ctx.reply(`👋 BIENVENIDA\nFoto: ${c.bienvenida_media?'✅':'❌'}\nTexto: ${(c.bienvenida_texto||'').slice(0,200)}`,{reply_markup:{inline_keyboard:[[{text:"📸 Foto",callback_data:"edit_bienvenida_foto", style:"primary"},{text:"📝 Texto Premium",callback_data:"edit_bienvenida_texto", style:"primary"}],[{text:"👁️ Preview",callback_data:"preview_start", style:"success"}],[{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]]}}); });
bot.action('panel_galeria',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); await ctx.reply(`🖼️ GALERIA\nFoto: ${c.galeria_media?'✅':'❌'}\nTexto: ${(c.galeria_texto||'').slice(0,200)}`,{reply_markup:{inline_keyboard:[[{text:"📸 Foto",callback_data:"edit_galeria_foto", style:"primary"},{text:"📝 Texto Premium",callback_data:"edit_galeria_texto", style:"primary"}],[{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]]}}); });
bot.action('panel_plantillas',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let snap=await getDocs(collection(db,"plantillas")).catch(()=>({docs:[]})); let kb=[]; snap.docs.slice(0,15).forEach(d=>{ kb.push([{text:`📄 ${d.data().nombre}`,callback_data:`plantilla_use_${d.id}`, style:"primary"},{text:"🗑️",callback_data:`plantilla_del_${d.id}`, style:"danger"}]); }); kb.push([{text:"➕ CREAR PREMIUM",callback_data:"edit_plantilla_texto", style:"success"}]); kb.push([{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]); await ctx.reply("📝 PLANTILLAS",{reply_markup:{inline_keyboard:kb}}); });
bot.action('panel_modelos',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let snap=await getModelos(); let kb=[]; let row=[]; snap.forEach(d=>{ row.push({text:d.data().perfil||d.id,callback_data:`mfoto_${d.id}`, style:"primary"}); if(row.length===2){ kb.push(row); row=[]; } }); if(row.length) kb.push(row); kb.push([{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]); await ctx.reply(`👸 MODELOS (${snap.size})`,{reply_markup:{inline_keyboard:kb}}); });
bot.action('panel_admins',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); let kb=[]; (c.admins||[]).forEach(id=>{ kb.push([{text:`👑 ${id}`,callback_data:"noop", style:"primary"},{text:"🗑️",callback_data:`admin_del_${id}`, style:"danger"}]); }); kb.push([{text:"➕ Añadir Admin",callback_data:"admin_add", style:"success"}]); kb.push([{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]); await ctx.reply("👑 ADMINS",{reply_markup:{inline_keyboard:kb}}); });
bot.action('panel_botones',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); await ctx.reply("🧩 BOTONES PREMIUM",{reply_markup:{inline_keyboard:[[{text:"BIENVENIDA",callback_data:"botones_bienvenida", style:"danger"}],[{text:"GALERIA",callback_data:"botones_galeria", style:"primary"}],[{text:"PLANTILLA",callback_data:"botones_plantilla", style:"success"}],[{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]]}}); });

bot.action('botones_bienvenida',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); let b=c.botones.bienvenida; await ctx.reply(`BIENVENIDA: 1.${b.galeria_virtual.text} 2.${b.lista_modelos.text} 3.${b.canal_oficial.text}`,{reply_markup:{inline_keyboard:[[{text:"1. Editar VIRTUAL 🔵",callback_data:"edit_btn_bienvenida_galeria_virtual", style:"primary"}],[{text:"2. Editar LISTA 🔴",callback_data:"edit_btn_bienvenida_lista_modelos", style:"danger"}],[{text:"3. Editar CANAL 🟢",callback_data:"edit_btn_bienvenida_canal_oficial", style:"success"}],[{text:"⬅️ Volver",callback_data:"panel_botones", style:"danger"}]]}}); });
bot.action('botones_galeria',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); await ctx.reply(`Colores hileras`,{reply_markup:{inline_keyboard:[[{text:"🎨 Cambiar colores 🔵🔴",callback_data:"edit_galeria_colores", style:"primary"}],[{text:"Editar CANAL 🟢",callback_data:"edit_btn_galeria_canal", style:"success"}],[{text:"Editar VIRTUAL 🔵",callback_data:"edit_btn_galeria_virtual", style:"primary"}],[{text:"⬅️ Volver",callback_data:"panel_botones", style:"danger"}]]}}); });
bot.action('botones_plantilla',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); let b=c.botones.plantilla; await ctx.reply(`${b.perfil_completo.text} ${b.bueno.text}|${b.malo.text}`,{reply_markup:{inline_keyboard:[[{text:"PERFIL 🔵",callback_data:"edit_btn_plantilla_perfil", style:"primary"}],[{text:"BUENO 🟢",callback_data:"edit_btn_plantilla_bueno", style:"success"},{text:"MALO 🔴",callback_data:"edit_btn_plantilla_malo", style:"danger"}],[{text:"FREE 🔵",callback_data:"edit_btn_plantilla_free", style:"primary"},{text:"CONTACTO 🔵",callback_data:"edit_btn_plantilla_contacto", style:"primary"}],[{text:"VOLVER 🔴",callback_data:"edit_btn_plantilla_volver", style:"danger"},{text:"INICIO 🔴",callback_data:"edit_btn_plantilla_inicio", style:"danger"}],[{text:"⬅️ Volver",callback_data:"panel_botones", style:"danger"}]]}}); });

bot.action(/edit_btn_(.*)/,async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]=`btn_${ctx.match[1]}`; await ctx.reply(`Manda NUEVO NOMBRE con premium 💎 para ${ctx.match[1]}`); });
bot.action('edit_galeria_colores',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='galeria_colores'; await ctx.reply("Manda 2 emojis ej: 🔵 🔴"); });
bot.action('edit_bienvenida_foto',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='foto_bienvenida'; await ctx.reply("📸 Foto"); });
bot.action('edit_bienvenida_texto',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='texto_bienvenida'; await ctx.reply("📝 Texto premium Variables: {mencion} {perfil} @{username} {edad} {nacionalidad} {Lista_servicios} {descripcion} {Votos} {porcentaje_buenos}% {porcentaje_malos}%"); });
bot.action('edit_galeria_foto',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='foto_galeria'; await ctx.reply("📸 Foto galeria"); });
bot.action('edit_galeria_texto',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='texto_galeria'; await ctx.reply("📝 Texto galeria {mencion}"); });
bot.action('edit_plantilla_texto',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='texto_plantilla'; await ctx.reply("📝 Plantilla premium"); });
bot.action('admin_add',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='add_admin_id'; await ctx.reply("Manda ID"); });
bot.action(/mfoto_(.*)/,async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]=`foto_modelo_${ctx.match[1]}`; await ctx.reply(`📸 Foto para ${ctx.match[1]}`); });
bot.action(/plantilla_use_(.*)/,async(ctx)=>{ await ctx.answerCbQuery("✅").catch(()=>{}); let s=await getDoc(doc(db,"plantillas",ctx.match[1])); if(s.exists()){ await setDoc(doc(db,"config","bot"),{plantilla_texto:s.data().texto,plantilla_entities:s.data().entities||[]},{merge:true}); clearCache(); } });
bot.action(/plantilla_del_(.*)/,async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); await deleteDoc(doc(db,"plantillas",ctx.match[1])); });
bot.action(/admin_del_(.*)/,async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); let admins=(c.admins||[]).filter(a=>a!==ctx.match[1]); await setDoc(doc(db,"config","bot"),{admins},{merge:true}); clearCache(); await ctx.reply("Eliminado"); });
bot.action('back_admin',async(ctx)=>{ try{ await ctx.answerCbQuery().catch(()=>{}); await ctx.deleteMessage().catch(()=>{}); }catch(e){} await bot.telegram.sendMessage(ctx.from.id,PANEL_TEXTO,{parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"👋 BIENVENIDA",callback_data:"panel_bienvenida", style:"danger"},{text:"📝 PLANTILLAS",callback_data:"panel_plantillas", style:"danger"}],[{text:"🖼️ GALERIA",callback_data:"panel_galeria", style:"primary"},{text:"👸 MODELOS",callback_data:"panel_modelos", style:"primary"}],[{text:"👑 ADMINS",callback_data:"panel_admins", style:"success"},{text:"🧩 BOTONES",callback_data:"panel_botones", style:"success"}]]}}); });
bot.action('preview_start',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); let texto=replaceVars(c.bienvenida_texto||"Hola {mencion}",{},ctx); if(c.bienvenida_media){ try{ await ctx.replyWithPhoto(c.bienvenida_media,{caption:texto,parse_mode:'HTML'}); return; }catch(e){} } await ctx.reply(texto,{parse_mode:'HTML'}); });
bot.action('noop',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); });

bot.on('photo',async(ctx)=>{
  if(!(await isAdmin(ctx))) return;
  let key=String(ctx.from.id); let st=esperando[key]; if(!st) return;
  let fileId=ctx.message.photo[ctx.message.photo.length-1].file_id;
  if(st.startsWith('foto_modelo_')){
    let idModel = st.replace('foto_modelo_','');
    await setDoc(doc(db,"modelos",idModel),{foto_file_id:fileId,foto:fileId},{merge:true});
    clearCache(); delete esperando[key];
    return ctx.reply("✅ Foto modelo TELEGRAM");
  }
  if(st==='foto_bienvenida'){ await setDoc(doc(db,"config","bot"),{bienvenida_media:fileId},{merge:true}); clearCache(); delete esperando[key]; return ctx.reply("✅ Bienvenida foto"); }
  if(st==='foto_galeria'){ await setDoc(doc(db,"config","bot"),{galeria_media:fileId},{merge:true}); clearCache(); delete esperando[key]; return ctx.reply("✅ Galeria foto"); }
});

bot.on('text',async(ctx)=>{
  let txt=ctx.message.text; if(txt.startsWith('/')) return; if(!(await isAdmin(ctx))) return;
  let key=String(ctx.from.id); let st=esperando[key]; if(!st) return;
  let entities=ctx.message.entities||[];
  if(st.startsWith('btn_')){
    let path=st.replace('btn_',''); let c=await getConfig(); let botones=c.botones;
    if(path==='bienvenida_galeria_virtual') botones.bienvenida.galeria_virtual.text=txt;
    if(path==='bienvenida_lista_modelos') botones.bienvenida.lista_modelos.text=txt;
    if(path==='bienvenida_canal_oficial') botones.bienvenida.canal_oficial.text=txt;
    if(path==='galeria_canal') botones.galeria.canal_oficial.text=txt;
    if(path==='galeria_virtual') botones.galeria.galeria_virtual.text=txt;
    if(path==='plantilla_perfil') botones.plantilla.perfil_completo.text=txt;
    if(path==='plantilla_bueno') botones.plantilla.bueno.text=txt;
    if(path==='plantilla_malo') botones.plantilla.malo.text=txt;
    if(path==='plantilla_free') botones.plantilla.canal_free.text=txt;
    if(path==='plantilla_contacto') botones.plantilla.contactame.text=txt;
    if(path==='plantilla_volver') botones.plantilla.volver.text=txt;
    if(path==='plantilla_inicio') botones.plantilla.inicio.text=txt;
    await setDoc(doc(db,"config","bot"),{botones},{merge:true}); clearCache(); delete esperando[key];
    return ctx.reply(`✅ Botón ${path} -> ${txt}`);
  }
  if(st==='galeria_colores'){ let parts=txt.trim().split(/\s+/); let map={"🔵":"primary","🔴":"danger","🟢":"success"}; let s1=map[parts[0]]||"primary"; let s2=map[parts[1]]||"danger"; let c=await getConfig(); c.botones.galeria.modelo_style_1=s1; c.botones.galeria.modelo_style_2=s2; c.botones.galeria.modelo_color_1=parts[0]; c.botones.galeria.modelo_color_2=parts[1]; await setDoc(doc(db,"config","bot"),{botones:c.botones},{merge:true}); clearCache(); delete esperando[key]; return ctx.reply(`✅ Colores: ${s1} ${s2}`); }
  if(st==='texto_bienvenida'){ await setDoc(doc(db,"config","bot"),{bienvenida_texto:txt,bienvenida_entities:entities},{merge:true}); clearCache(); delete esperando[key]; return ctx.reply("✅ Bienvenida premium"); }
  if(st==='texto_galeria'){ await setDoc(doc(db,"config","bot"),{galeria_texto:txt,galeria_entities:entities},{merge:true}); clearCache(); delete esperando[key]; return ctx.reply("✅ Galeria premium"); }
  if(st==='texto_plantilla'){ temp[key]={texto:txt,entities}; esperando[key]='nombre_plantilla'; return ctx.reply("Nombre plantilla?"); }
  if(st==='nombre_plantilla'){ let t=temp[key]; let nombre=txt.slice(0,40); let id=Date.now().toString(); await setDoc(doc(db,"plantillas",id),{nombre,texto:t.texto,entities:t.entities,fecha:new Date().toISOString()}); await setDoc(doc(db,"config","bot"),{plantilla_texto:t.texto,plantilla_entities:t.entities},{merge:true}); clearCache(); delete esperando[key]; delete temp[key]; return ctx.reply(`✅ Plantilla ${nombre}`); }
  if(st==='add_admin_id'){ let id=txt.replace(/\D/g,''); let c=await getConfig(); let admins=c.admins||[]; if(!admins.includes(id)) admins.push(id); await setDoc(doc(db,"config","bot"),{admins},{merge:true}); clearCache(); delete esperando[key]; return ctx.reply(`👑 Admin ${id}`); }
});

bot.action('lista',async(ctx)=>{
  await ctx.answerCbQuery().catch(()=>{});
  let c=await getConfig(); let texto=replaceVars(c.galeria_texto||"👑 GALERIA {mencion}",{},ctx);
  let snap=await getModelos(); let kb=[]; let row=[]; let i=0;
  snap.forEach(d=>{
    let m=d.data(); let style = i%2===0? (c.botones.galeria.modelo_style_1||"primary") : (c.botones.galeria.modelo_style_2||"danger");
    row.push({text:m.perfil||d.id, callback_data:`ver_${d.id}`, style});
    if(row.length===2){ kb.push(row); row=[]; }
    i++;
  });
  if(row.length) kb.push(row);
  kb.push([{text:c.botones.galeria.canal_oficial.text, url:c.botones.galeria.canal_oficial.url||CANAL_OFICIAL, style:c.botones.galeria.canal_oficial.style}]);
  kb.push([{text:c.botones.galeria.galeria_virtual.text, web_app:{url:WEBAPP_URL}, style:c.botones.galeria.galeria_virtual.style}]);
  try{ await ctx.deleteMessage(); }catch(e){}
  if(c.galeria_media){ try{ await ctx.replyWithPhoto(c.galeria_media,{caption:texto,parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); return; }catch(e){} }
  await ctx.reply(texto,{parse_mode:'HTML',reply_markup:{inline_keyboard:kb}});
});

bot.action(/ver_(.*)/,async(ctx)=>{
  await ctx.answerCbQuery().catch(()=>{});
  let id=ctx.match[1].trim(); let snap=await getDoc(doc(db,"modelos",id)).catch(()=>null); if(!snap||!snap.exists()) return ctx.reply("❌ No existe");
  let m={id:snap.id,...snap.data()}; let c=await getConfig(); let b=c.botones.plantilla;
  let caption=replaceVars(c.plantilla_texto||"👑 {perfil} 👑",m,ctx);
  let media=m.foto_file_id||m.foto||null;
  let kb=[
    [{text:b.perfil_completo.text, web_app:{url:`${WEBAPP_URL}?m=${m.id}`}, style:b.perfil_completo.style}],
    [{text:`${b.bueno.text} ${m.votosBueno||0}`,callback_data:`voto_bueno_${m.id}`, style:b.bueno.style},{text:`${b.malo.text} ${m.votosMalo||0}`,callback_data:`voto_malo_${m.id}`, style:b.malo.style}],
    [{text:b.canal_free.text, url:m.canalFree||CANAL_OFICIAL, style:b.canal_free.style},{text:b.contactame.text, url:m.contacto||`https://t.me/${m.username||''}`, style:b.contactame.style}],
    [{text:b.volver.text, callback_data:"lista", style:b.volver.style},{text:b.inicio.text, callback_data:"inicio", style:b.inicio.style}]
  ];
  try{ await ctx.deleteMessage(); }catch(e){}
  if(media){ try{ await ctx.replyWithPhoto(media,{caption,parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); return; }catch(e){} }
  await ctx.reply(caption,{parse_mode:'HTML',reply_markup:{inline_keyboard:kb}});
});

bot.action('inicio',async(ctx)=>{
  await ctx.answerCbQuery().catch(()=>{});
  let c=await getConfig(); let texto=replaceVars(c.bienvenida_texto||"Hola {mencion}",{},ctx); let b=c.botones.bienvenida;
  let kb=[[{text:b.galeria_virtual.text,web_app:{url:WEBAPP_URL}, style:b.galeria_virtual.style}],[{text:b.lista_modelos.text,callback_data:"lista", style:b.lista_modelos.style}],[{text:b.canal_oficial.text,url:b.canal_oficial.url||CANAL_OFICIAL, style:b.canal_oficial.style}]];
  try{ await ctx.deleteMessage(); }catch(e){}
  if(c.bienvenida_media){ try{ await ctx.replyWithPhoto(c.bienvenida_media,{caption:texto,parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); return; }catch(e){} }
  await ctx.reply(texto,{parse_mode:'HTML',reply_markup:{inline_keyboard:kb}});
});

bot.action(/voto_(bueno|malo)_(.*)/,async(ctx)=>{ await ctx.answerCbQuery("✅").catch(()=>{}); let tipo=ctx.match[1]; let id=ctx.match[2]; let ref=doc(db,"modelos",id); if(tipo==='bueno') await updateDoc(ref,{votosBueno:increment(1)}).catch(async()=>{ await setDoc(ref,{votosBueno:1},{merge:true}); }); else await updateDoc(ref,{votosMalo:increment(1)}).catch(async()=>{ await setDoc(ref,{votosMalo:1},{merge:true}); }); clearCache(); });

const app=express(); app.use(express.json());
app.get('/',(req,res)=>res.send('Bot OK - FIXED'));
app.post('/webhook',(req,res)=>{ bot.handleUpdate(req.body).then(()=>res.send('ok')).catch(()=>res.send('ok')); });
const PORT=process.env.PORT||3000;
app.listen(PORT,async()=>{ console.log('Bot fixed'); const ext=process.env.RENDER_EXTERNAL_URL; if(ext){ try{ await bot.telegram.setWebhook(`${ext}/webhook`); }catch(e){} } });
