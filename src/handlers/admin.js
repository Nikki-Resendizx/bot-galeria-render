// src/handlers/admin.js - FIX v14 MODULAR
const { getConfig, getModelos, clearCache } = require('../cache');
const { isAdmin } = require('../utils');
const { doc, getDoc, setDoc, collection, getDocs, deleteDoc } = require('firebase/firestore');
const { db } = require('../firebase');

let esperando={}; let temp={};
module.exports.esperando=esperando;
module.exports.temp=temp;

const PANEL_TEXTO=`👑 <b>PANEL ADMIN V14 MODULAR</b> 👑`;

module.exports = (bot) => {

  bot.command('admin', async(ctx)=>{
    if(!(await isAdmin(ctx))) return; delete esperando[String(ctx.from.id)];
    await ctx.reply(PANEL_TEXTO,{parse_mode:'HTML',reply_markup:{inline_keyboard:[
      [{text:"👋🏻 BIENVENIDA",callback_data:"panel_bienvenida", style:"danger"},{text:"📝 PLANTILLAS",callback_data:"panel_plantillas", style:"danger"}],
      [{text:"🖼️ GALERIA",callback_data:"panel_galeria", style:"primary"},{text:"👸🏻 MODELOS",callback_data:"panel_modelos", style:"primary"}],
      [{text:"👑 ADMINS",callback_data:"panel_admins", style:"success"},{text:"🧩 BOTONES",callback_data:"panel_botones", style:"success"}]
    ]}});
  });

  bot.command('cancel', async(ctx)=>{ delete esperando[String(ctx.from.id)]; await ctx.reply("✅"); });

  bot.action('panel_bienvenida', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); await ctx.reply(`👋🏻 BIENVENIDA\nFoto: ${c.bienvenida_media?'✅':'❌'}`,{reply_markup:{inline_keyboard:[[{text:"📸 Foto",callback_data:"edit_bienvenida_foto", style:"primary"},{text:"📝 Texto Premium",callback_data:"edit_bienvenida_texto", style:"primary"}],[{text:"👁️ Preview",callback_data:"preview_start", style:"success"}],[{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]]}}); });
  bot.action('panel_galeria', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); await ctx.reply(`🖼️ GALERIA`,{reply_markup:{inline_keyboard:[[{text:"📸 Foto",callback_data:"edit_galeria_foto", style:"primary"},{text:"📝 Texto",callback_data:"edit_galeria_texto", style:"primary"}],[{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]]}}); });
  bot.action('panel_plantillas', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let snap=await getDocs(collection(db,"plantillas")).catch(()=>({docs:[]})); let kb=[]; snap.docs.slice(0,15).forEach(d=>{ kb.push([{text:`📄 ${d.data().nombre}`,callback_data:`plantilla_use_${d.id}`, style:"primary"},{text:"🗑️",callback_data:`plantilla_del_${d.id}`, style:"danger"}]); }); kb.push([{text:"➕ CREAR PREMIUM",callback_data:"edit_plantilla_texto", style:"success"}]); kb.push([{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]); await ctx.reply("📝 PLANTILLAS",{reply_markup:{inline_keyboard:kb}}); });
  bot.action('panel_modelos', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let snap=await getModelos(); let kb=[]; let row=[]; snap.forEach(d=>{ row.push({text:d.data().perfil||d.id,callback_data:`mfoto_${d.id}`, style:"primary"}); if(row.length===2){ kb.push(row); row=[]; } }); if(row.length) kb.push(row); kb.push([{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]); await ctx.reply(`👸🏻 MODELOS (${snap.size})`,{reply_markup:{inline_keyboard:kb}}); });
  bot.action('panel_admins', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); let kb=[]; (c.admins||[]).forEach(id=>{ kb.push([{text:`👑 ${id}`,callback_data:"noop", style:"primary"},{text:"🗑️",callback_data:`admin_del_${id}`, style:"danger"}]); }); kb.push([{text:"➕ Añadir Admin",callback_data:"admin_add", style:"success"}]); kb.push([{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]); await ctx.reply("👑 ADMINS",{reply_markup:{inline_keyboard:kb}}); });
  bot.action('panel_botones', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); await ctx.reply("🧩 BOTONES - Nombre, color, premium",{reply_markup:{inline_keyboard:[[{text:"BIENVENIDA",callback_data:"botones_bienvenida", style:"danger"}],[{text:"GALERIA",callback_data:"botones_galeria", style:"primary"}],[{text:"PLANTILLA",callback_data:"botones_plantilla", style:"success"}],[{text:"⬅️ Volver",callback_data:"back_admin", style:"danger"}]]}}); });

  bot.action('botones_bienvenida', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); await ctx.reply("BIENVENIDA",{reply_markup:{inline_keyboard:[[{text:"VIRTUAL 🔵 WEDAPP",callback_data:"edit_btn_bienvenida_galeria_virtual", style:"primary"}],[{text:"LISTA 🔴",callback_data:"edit_btn_bienvenida_lista_modelos", style:"danger"}],[{text:"CANAL 🟢",callback_data:"edit_btn_bienvenida_canal_oficial", style:"success"}],[{text:"⬅️ Volver",callback_data:"panel_botones", style:"danger"}]]}}); });
  bot.action('botones_galeria', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); await ctx.reply("GALERIA",{reply_markup:{inline_keyboard:[[{text:"🎨 Hileras 🔵🔴",callback_data:"edit_galeria_colores", style:"primary"}],[{text:"CANAL 🟢",callback_data:"edit_btn_galeria_canal", style:"success"}],[{text:"VIRTUAL 🔵",callback_data:"edit_btn_galeria_virtual", style:"primary"}],[{text:"⬅️ Volver",callback_data:"panel_botones", style:"danger"}]]}}); });
  bot.action('botones_plantilla', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); await ctx.reply("PLANTILLA",{reply_markup:{inline_keyboard:[[{text:"PERFIL 🔵",callback_data:"edit_btn_plant
