const express = require('express');
const { Telegraf } = require('telegraf');
const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, collection, getDocs, query, orderBy, increment, updateDoc, deleteDoc } = require('firebase/firestore');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://galeria-verifiedmodels.pages.dev";
const ADMIN_IDS_ENV = (process.env.ADMIN_IDS || "").split(",").map(s=>s.trim()).filter(Boolean);

if (!getApps().length) {
  initializeApp({ apiKey:"AIzaSyAIHevrpglvhHK3IsxpnkHlWpxnuf5o1So",authDomain:"galeria-verifiedmodels.firebaseapp.com",projectId:"galeria-verifiedmodels",storageBucket:"galeria-verifiedmodels.firebasestorage.app",messagingSenderId:"684551560793",appId:"1:684551560793:web:3730a07d8d6ec737e3db48"});
}
const db=getFirestore();
const bot = new Telegraf(BOT_TOKEN);

let cache = { config: null, configTime: 0, modelos: null, modelosTime: 0 };
const CACHE_MS = 5 * 60 * 1000;

async function getConfig(){
  if(cache.config && Date.now() - cache.configTime < CACHE_MS) return cache.config;
  try{
    let s=await getDoc(doc(db,"config","bot"));
    if(s.exists()){
      cache.config = s.data();
      cache.configTime = Date.now();
      return cache.config;
    }
  }catch(e){ console.log("FB config error:", e.message); }
  return cache.config || { bienvenida_texto:"Hola {mencion} 👑", galeria_texto:"👑 GALERIA {mencion}", plantilla_texto:"👑 {perfil} 👑\n{descripcion}", bienvenida_media:null, galeria_media:null, admins:[] };
}
async function getModelos(){
  if(cache.modelos && Date.now() - cache.modelosTime < CACHE_MS) return cache.modelos;
  try{
    let snap = await getDocs(collection(db,"modelos")).catch(()=>null);
    if(snap){ cache.modelos = snap; cache.modelosTime = Date.now(); return snap; }
  }catch(e){ console.log("FB modelos error:", e.message); }
  return cache.modelos || { size:0, docs:[], forEach:()=>{} };
}
function clearCache(){ cache.config=null; cache.modelos=null; }

async function isAdmin(ctx){ let id=String(ctx.from?.id||""); if(ADMIN_IDS_ENV.includes(id)) return true; try{ let c=await getConfig(); if(c.admins && c.admins.includes(id)) return true; }catch(e){} if(ADMIN_IDS_ENV.length===0) return true; return false; }
function getMencion(ctx){ let n=(ctx.from.first_name||"").replace(/</g,'').replace(/>/g,''); return n?`<a href="tg://user?id=${ctx.from.id}">${n}</a>`:""; }
function replaceVars(str,m={},ctx=null){ if(!str) return ""; let total=(m.votosMalo||0)+(m.votosBueno||0); let pBueno=total?Math.round((m.votosBueno||0)/total*100):0; let lista=m.servicios?.map(s=>`• ${s}`).join('\n')||'• -'; let mencion=ctx?getMencion(ctx):"{mencion}"; return str.replaceAll('{mencion}',mencion).replaceAll('{perfil}',m.perfil||'').replaceAll('{username}',m.username||'').replaceAll('{edad}',String(m.edad||'')).replaceAll('{nacionalidad}',m.nacionalidad||'').replaceAll('{servicios}',m.servicios?.join(' • ')||'-').replaceAll('{servicios_lista}',lista).replaceAll('{descripcion}',m.descripcion||'').replaceAll('{votos}',String(total)).replaceAll('{votosBueno}',String(m.votosBueno||0)).replaceAll('{votosMalo}',String(m.votosMalo||0)).replaceAll('{porcentajeBueno}',String(pBueno)).replaceAll('{id}',m.id||'').replaceAll('{canalFree}',m.canalFree||m.canal_free||'https://t.me/').replaceAll('{contacto}',m.contacto||`https://t.me/${m.username||''}`); }
function getMediaModelo(m){ return m.foto_file_id||m.foto||null; }
let esperando={}; let plantillaTemp={};
const TEXTO_PANEL=`👑 <b>𝗣𝗔𝗡𝗘𝗟 𝗗𝗘 𝗖𝗢𝗡𝗙𝗚. 𝗔𝗗𝗠𝗜𝗡</b> 👑\n\n👋 BIENVENID@ AL PANEL`;

// START - GUARDA USUARIO PERO NO GASTA LECTURAS
bot.start(async(ctx)=>{
  try{
    // Guardar usuario en Telegram file_id mode - no leemos, solo escribimos
    setDoc(doc(db,"usuarios",String(ctx.from.id)),{id:String(ctx.from.id),first_name:ctx.from.first_name||"",username:ctx.from.username||""},{merge:true}).catch(()=>{});
    let c=await getConfig();
    let texto=replaceVars(c.bienvenida_texto||"Hola {mencion} 👑",{},ctx);
    let kb=[[{text:"💖 𝗩𝗘𝗥 𝗚𝗔𝗟𝗘𝗥𝗜𝗔 𝗩𝗜𝗥𝗧𝗨𝗔𝗟 💖",web_app:{url:WEBAPP_URL},style:"success"}],[{text:"👑 𝗩𝗘𝗥 𝗟𝗜𝗦𝗧𝗔 𝗗𝗘 𝗠𝗢𝗗𝗘𝗟𝗢𝗦 👑",callback_data:"lista",style:"primary"}]];
    if(c.bienvenida_media){
      try{ await ctx.replyWithPhoto(c.bienvenida_media,{caption:texto,parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); return; }catch(e){ console.log("bienvenida photo err",e.message); }
    }
    await ctx.reply(texto,{parse_mode:'HTML',reply_markup:{inline_keyboard:kb}});
  }catch(e){ console.log(e); }
});

bot.command('admin',async(ctx)=>{ if(!(await isAdmin(ctx))) return ctx.reply("❌ No eres admin"); delete esperando[String(ctx.from.id)]; await ctx.reply(TEXTO_PANEL,{parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"👋 BIENVENIDA",callback_data:"panel_bienvenida",style:"primary"},{text:"💾 PLANTILLAS",callback_data:"panel_plantillas",style:"primary"}],[{text:"🖼️ GALERIA",callback_data:"panel_galeria",style:"success"},{text:"💃 MODELOS",callback_data:"panel_modelos",style:"success"}],[{text:"👥 USUARIOS",callback_data:"panel_usuarios",style:"danger"},{text:"👑 ADMINS",callback_data:"panel_admins",style:"danger"}],[{text:"🔄 Limpiar Cache",callback_data:"clear_cache",style:"primary"}]]}}); });
bot.command('cancel',async(ctx)=>{ delete esperando[String(ctx.from.id)]; await ctx.reply("✅ Cancelado - /admin"); });
bot.action('clear_cache', async(ctx)=>{ await ctx.answerCbQuery("✅ Cache limpiado").catch(()=>{}); clearCache(); await ctx.reply("✅ Cache limpiado"); });

// FIX: BIENVENIDA Y GALERIA AHORA SI RESPONDEN
bot.action('panel_bienvenida',async(ctx)=>{
  try{ await ctx.answerCbQuery(); }catch(e){}
  let c=await getConfig();
  await ctx.reply(`👋 <b>BIENVENIDA EDITOR - TELEGRAM MODE</b>\nFoto: ${c.bienvenida_media?'✅ file_id Telegram':'❌'}\nTexto: ${(c.bienvenida_texto||'').substring(0,350)}\n\n💎 Soporta emojis premium`,{parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"📸 Cambiar FOTO (Telegram)",callback_data:"edit_bienvenida_foto",style:"primary"},{text:"📝 Cambiar TEXTO Premium",callback_data:"edit_bienvenida_texto",style:"primary"}],[{text:"👁️ Preview",callback_data:"preview_start",style:"success"}],[{text:"⬅️ Volver",callback_data:"back_admin",style:"danger"}]]}});
});
bot.action('panel_galeria',async(ctx)=>{
  try{ await ctx.answerCbQuery(); }catch(e){}
  let c=await getConfig();
  await ctx.reply(`🖼️ <b>GALERIA EDITOR - TELEGRAM MODE</b>\nFoto: ${c.galeria_media?'✅ file_id Telegram':'❌'}\nTexto: ${(c.galeria_texto||'').substring(0,350)}\n\n💎 Soporta emojis premium`,{parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"📸 Foto (Telegram)",callback_data:"edit_galeria_foto",style:"primary"},{text:"📝 Texto Premium",callback_data:"edit_galeria_texto",style:"primary"}],[{text:"⬅️ Volver",callback_data:"back_admin",style:"danger"}]]}});
});
bot.action('panel_plantillas',async(ctx)=>{ try{ await ctx.answerCbQuery(); }catch(e){} let snap=await getDocs(collection(db,"plantillas")).catch(()=>({docs:[] })); let kb=[]; snap.docs.slice(0,10).forEach(d=>{ kb.push([{text:`📄 ${d.data().nombre}`,callback_data:`plantilla_use_${d.id}`,style:"primary"},{text:"🗑️",callback_data:`plantilla_del_${d.id}`,style:"danger"}]); }); kb.push([{text:"➕ CREAR NUEVA PREMIUM",callback_data:"edit_plantilla_texto",style:"success"}]); kb.push([{text:"⬅️ Volver",callback_data:"back_admin",style:"danger"}]); await ctx.reply(`💾 <b>PLANTILLAS PREMIUM</b>\nLas plantillas ahora guardan custom_emoji`,{parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); });
bot.action('panel_modelos',async(ctx)=>{ try{ await ctx.answerCbQuery("⏳ Cargando desde Telegram cache..."); }catch(e){} let snap = await getModelos(); let kb=[]; let row=[]; snap.forEach(d=>{ let m=d.data(); let has=getMediaModelo(m)?"📸":"❌"; row.push({text:`${has} ${m.perfil||d.id}`,callback_data:`mfoto_${d.id}`,style:has==="📸"?"success":"danger"}); if(row.length===2){ kb.push(row); row=[]; } }); if(row.length) kb.push(row); kb.push([{text:"⬅️ Volver",callback_data:"back_admin",style:"danger"}]); await ctx.reply(`💃 MODELOS (${snap.size}) - Fotos en TELEGRAM file_id`,{reply_markup:{inline_keyboard:kb}}); });
bot.action('panel_usuarios',async(ctx)=>{ try{ await ctx.answerCbQuery(); }catch(e){} await ctx.reply(`👥 Usuarios deshabilitado para ahorrar Firebase`,{reply_markup:{inline_keyboard:[[{text:"⬅️ Volver",callback_data:"back_admin",style:"danger"}]]}}); });
bot.action('panel_admins',async(ctx)=>{ try{ await ctx.answerCbQuery(); }catch(e){} let c=await getConfig(); let admins=c.admins||[]; let kb=[]; admins.forEach(id=>{ kb.push([{text:`👑 ${id}`,callback_data:`admin_ver_${id}`,style:"primary"},{text:"🗑️",callback_data:`admin_del_${id}`,style:"danger"}]); }); kb.push([{text:"➕ Agregar Admin",callback_data:"admin_add",style:"success"}]); kb.push([{text:"⬅️ Volver",callback_data:"back_admin",style:"danger"}]); await ctx.reply(`👑 ADMINS (${admins.length})`,{reply_markup:{inline_keyboard:kb}}); });

bot.action('edit_bienvenida_foto',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='foto_bienvenida'; await ctx.reply("📸 Manda FOTO - Se guardará como file_id TELEGRAM"); });
bot.action('edit_bienvenida_texto',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='texto_bienvenida'; await ctx.reply("📝 Manda TEXTO con EMOJIS PREMIUM 💎 ahora"); });
bot.action('edit_galeria_foto',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='foto_galeria'; await ctx.reply("📸 Manda FOTO galeria TELEGRAM"); });
bot.action('edit_galeria_texto',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='texto_galeria'; await ctx.reply("📝 Manda TEXTO galeria con EMOJIS PREMIUM"); });
bot.action('edit_plantilla_texto',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='texto_plantilla'; await ctx.reply("📝 Manda PLANTILLA con EMOJIS PREMIUM"); });
bot.action('admin_add',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='add_admin_id'; await ctx.reply("👑 Manda ID nuevo admin"); });
bot.action(/mfoto_(.*)/,async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); if(!(await isAdmin(ctx))) return; let id=ctx.match[1]; esperando[String(ctx.from.id)]=`foto_modelo_${id}`; await ctx.reply(`📸 Manda foto para ${id} ahora - TELEGRAM file_id`); });
bot.action(/plantilla_use_(.*)/,async(ctx)=>{ await ctx.answerCbQuery("✅ Activada").catch(()=>{}); if(!(await isAdmin(ctx))) return; let s=await getDoc(doc(db,"plantillas",ctx.match[1])); if(!s.exists()) return; await setDoc(doc(db,"config","bot"),{plantilla_texto:s.data().texto,plantilla_entities:s.data().entities||[]},{merge:true}); clearCache(); });
bot.action(/plantilla_del_(.*)/,async(ctx)=>{ await ctx.answerCbQuery("Eliminada").catch(()=>{}); if(!(await isAdmin(ctx))) return; await deleteDoc(doc(db,"plantillas",ctx.match[1])); });
bot.action(/admin_del_(.*)/,async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); if(!(await isAdmin(ctx))) return; let id=ctx.match[1]; let c=await getConfig(); let admins=(c.admins||[]).filter(a=>a!==String(id)); await setDoc(doc(db,"config","bot"),{admins},{merge:true}); clearCache(); await ctx.reply(`🗑️ Admin ${id} eliminado`); });
bot.action('back_admin',async(ctx)=>{ try{ await ctx.answerCbQuery(); }catch(e){} try{ await ctx.deleteMessage(); }catch(e){} await bot.telegram.sendMessage(ctx.from.id,TEXTO_PANEL,{parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"👋 BIENVENIDA",callback_data:"panel_bienvenida",style:"primary"},{text:"💾 PLANTILLAS",callback_data:"panel_plantillas",style:"primary"}],[{text:"🖼️ GALERIA",callback_data:"panel_galeria",style:"success"},{text:"💃 MODELOS",callback_data:"panel_modelos",style:"success"}],[{text:"👥 USUARIOS",callback_data:"panel_usuarios",style:"danger"},{text:"👑 ADMINS",callback_data:"panel_admins",style:"danger"}],[{text:"🔄 Limpiar Cache",callback_data:"clear_cache",style:"primary"}]]}}); });
bot.action('preview_start',async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); let texto=replaceVars(c.bienvenida_texto||"Hola {mencion}",{},ctx); if(c.bienvenida_media){ try{ await ctx.replyWithPhoto(c.bienvenida_media,{caption:texto,parse_mode:'HTML'}); return; }catch(e){} } await ctx.reply(texto,{parse_mode:'HTML'}); });

// FOTOS 100% TELEGRAM
bot.on('photo',async(ctx)=>{
  if(!(await isAdmin(ctx))) return;
  let key=String(ctx.from.id); let st=esperando[key]; if(!st) return;
  let fileId=ctx.message.photo[ctx.message.photo.length-1].file_id;
  if(st.startsWith('foto_modelo_')){
    let id=st.replace('foto_modelo_','');
    await setDoc(doc(db,"modelos",id),{foto_file_id:fileId,foto:fileId},{merge:true});
    clearCache(); delete esperando[key];
    return ctx.reply(`✅ Foto modelo ${id} guardada EN TELEGRAM`);
  }
  if(st==='foto_bienvenida'){ await setDoc(doc(db,"config","bot"),{bienvenida_media:fileId},{merge:true}); clearCache(); delete esperando[key]; return ctx.reply("✅ BIENVENIDA foto guardada EN TELEGRAM"); }
  if(st==='foto_galeria'){ await setDoc(doc(db,"config","bot"),{galeria_media:fileId},{merge:true}); clearCache(); delete esperando[key]; return ctx.reply("✅ GALERIA foto guardada EN TELEGRAM"); }
});

// TEXTO CON EMOJIS PREMIUM - GUARDA ENTITIES
bot.on('text',async(ctx)=>{
  let txt=ctx.message.text; if(txt.startsWith('/')) return; if(!(await isAdmin(ctx))) return;
  let key=String(ctx.from.id); let st=esperando[key]; if(!st) return;
  let entities = ctx.message.entities || [];
  if(st==='texto_bienvenida'){ await setDoc(doc(db,"config","bot"),{bienvenida_texto:txt,bienvenida_entities:entities},{merge:true}); clearCache(); delete esperando[key]; return ctx.reply("✅ BIENVENIDA texto guardado CON PREMIUM 💎"); }
  if(st==='texto_galeria'){ await setDoc(doc(db,"config","bot"),{galeria_texto:txt,galeria_entities:entities},{merge:true}); clearCache(); delete esperando[key]; return ctx.reply("✅ GALERIA texto guardado CON PREMIUM 💎"); }
  if(st==='texto_plantilla'){ plantillaTemp[key]={texto:txt,entities}; esperando[key]='nombre_plantilla'; return ctx.reply("Ahora manda NOMBRE de plantilla"); }
  if(st==='nombre_plantilla'){ let temp=plantillaTemp[key]; let nombre=txt.slice(0,40); let newId=Date.now().toString(); await setDoc(doc(db,"plantillas",newId),{nombre,texto:temp.texto,entities:temp.entities,fecha:new Date().toISOString()}); await setDoc(doc(db,"config","bot"),{plantilla_texto:temp.texto,plantilla_entities:temp.entities},{merge:true}); clearCache(); delete esperando[key]; delete plantillaTemp[key]; return ctx.reply(`✅ Plantilla "${nombre}" creada CON PREMIUM`); }
  if(st==='add_admin_id'){ let id=txt.replace(/\D/g,''); if(!id) return ctx.reply("ID invalido"); let c=await getConfig(); let admins=c.admins||[]; if(!admins.includes(id)) admins.push(id); await setDoc(doc(db,"config","bot"),{admins},{merge:true}); clearCache(); delete esperando[key]; return ctx.reply(`👑 Admin ${id} agregado`); }
});

bot.action('lista',async(ctx)=>{ try{ await ctx.answerCbQuery(); }catch(e){} let c=await getConfig(); let texto=replaceVars(c.galeria_texto||"👑 GALERIA {mencion}",{},ctx); let snap = await getModelos(); let kb=[]; let row=[]; snap.forEach(d=>{ let m=d.data(); let btn={text:(m.perfil||d.id).replace(/@/g,'').trim(),callback_data:`ver_${d.id}`,style:row.length===0?"primary":"danger"}; row.push(btn); if(row.length===2){ kb.push(row); row=[]; } }); if(row.length) kb.push(row); kb.push([{text:"𝗩𝗘𝗥 𝗚𝗔𝗟𝗘𝗥𝗜𝗔 𝗩𝗜𝗥𝗧𝗨𝗔𝗟 💖",web_app:{url:WEBAPP_URL},style:"success"}]); try{ await ctx.deleteMessage(); }catch(e){} if(c.galeria_media){ try{ await ctx.replyWithPhoto(c.galeria_media,{caption:texto,parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); return; }catch(e){} } await ctx.reply(texto,{parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); });

bot.action(/ver_(.*)/,async(ctx)=>{ try{ await ctx.answerCbQuery(); }catch(e){} let id=ctx.match[1].trim(); let snap=await getDoc(doc(db,"modelos",id)).catch(()=>null); if(!snap ||!snap.exists()) return ctx.reply("❌ No existe"); let m={id:snap.id,...snap.data()}; let c=await getConfig(); let caption=replaceVars(c.plantilla_texto||"👑 {perfil} 👑\nHola {mencion}\nVotos: {votos}\n{servicios_lista}",m,ctx); let media=getMediaModelo(m); let canalFree=m.canalFree||m.canal_free||"https://t.me/"; let contacto=m.contacto||`https://t.me/${m.username||''}`; let kb=[[{text:"💖 𝗩𝗘𝗥 𝗣𝗘𝗥𝗙𝗜𝗟 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗢 💖",web_app:{url:`${WEBAPP_URL}?m=${m.id}`},style:"success"}],[{text:`👍 Bueno ${m.votosBueno||0}`,callback_data:`voto_bueno_${m.id}`,style:"success"},{text:`👎 Malo ${m.votosMalo||0}`,callback_data:`voto_malo_${m.id}`,style:"danger"}],[{text:"💎 𝗖𝗔𝗡𝗔𝗟 𝗙𝗥𝗘𝗘",url:canalFree,style:"primary"},{text:"💬 𝗖𝗢𝗡𝗧𝗔𝗖𝗧𝗔𝗥",url:contacto,style:"primary"}],[{text:"👈🏻 VOLVER",callback_data:"lista",style:"danger"},{text:"👑 INICIO",callback_data:"inicio",style:"danger"}]]; try{ await ctx.deleteMessage(); }catch(e){} if(media){ try{ await ctx.replyWithPhoto(media,{caption,parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); return; }catch(e){} } await ctx.reply(caption,{parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); });

bot.action('inicio',async(ctx)=>{ try{ await ctx.answerCbQuery(); }catch(e){} let c=await getConfig(); let texto=replaceVars(c.bienvenida_texto||"Hola {mencion} 👑",{},ctx); let kb=[[{text:"💖 GALERÍA",web_app:{url:WEBAPP_URL},style:"success"}],[{text:"📋 LISTA",callback_data:"lista",style:"primary"}]]; try{ await ctx.deleteMessage(); }catch(e){} if(c.bienvenida_media){ try{ await ctx.replyWithPhoto(c.bienvenida_media,{caption:texto,parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); return; }catch(e){} } await ctx.reply(texto,{parse_mode:'HTML',reply_markup:{inline_keyboard:kb}}); });

bot.action(/voto_(bueno|malo)_(.*)/,async(ctx)=>{ try{ await ctx.answerCbQuery("✅ Voto"); }catch(e){} let tipo=ctx.match[1]; let id=ctx.match[2]; let ref=doc(db,"modelos",id); if(tipo==='bueno') await updateDoc(ref,{votosBueno:increment(1)}).catch(async()=>{ await setDoc(ref,{votosBueno:1},{merge:true}); }); else await updateDoc(ref,{votosMalo:increment(1)}).catch(async()=>{ await setDoc(ref,{votosMalo:1},{merge:true}); }); clearCache(); });

const app=express(); app.use(express.json());
app.get('/',(req,res)=>res.send('Bot OK - TELEGRAM STORAGE + PREMIUM'));
app.post('/webhook',(req,res)=>{ bot.handleUpdate(req.body).then(()=>res.send('ok')).catch(()=>res.send('ok')); });
const PORT=process.env.PORT||3000;
app.listen(PORT,async()=>{ console.log('Bot TELEGRAM MODE ON'); const external=process.env.RENDER_EXTERNAL_URL; if(external){ try{ await bot.telegram.setWebhook(`${external}/webhook`); console.log('Webhook',`${external}/webhook`); }catch(e){ console.log(e.message); } } });
