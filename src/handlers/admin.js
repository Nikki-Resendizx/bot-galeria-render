const { isAdmin } = require('../utils');
const { getConfig } = require('../cache');
const { doc, getDoc, setDoc, collection, getDocs, deleteDoc } = require('firebase/firestore');
const { db } = require('../firebase');
const { clearCache } = require('../cache');

let esperando = {};
let temp = {};

module.exports.esperando = esperando;

module.exports = (bot) => {

  bot.command('admin', async(ctx)=>{
    if(!isAdmin(ctx.from.id)) return;
    delete esperando[String(ctx.from.id)];
    await ctx.reply(`👑 <b>PANEL ADMIN V14 MODULAR</b> 👑`,{parse_mode:'HTML',reply_markup:{inline_keyboard:[
      [{text:"👋🏻 BIENVENIDA",callback_data:"panel_bienvenida"},{text:"📝 PLANTILLAS",callback_data:"panel_plantillas"}],
      [{text:"🖼️ GALERIA",callback_data:"panel_galeria"},{text:"👸🏻 MODELOS",callback_data:"panel_modelos"}],
      [{text:"👑 ADMINS",callback_data:"panel_admins"},{text:"🧩 BOTONES",callback_data:"panel_botones"}]
    ]}});
  });

  bot.command('cancel', async(ctx)=>{ delete esperando[String(ctx.from.id)]; await ctx.reply("✅ Cancelado"); });

  bot.action('panel_bienvenida', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); await ctx.editMessageText(`👋🏻 BIENVENIDA\nFoto: ${c.bienvenida_media?'✅':'❌'}\nTexto: ${(c.bienvenida_texto||'').slice(0,40)}`,{parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"📸 Foto",callback_data:"edit_bienvenida_foto"},{text:"📝 Texto",callback_data:"edit_bienvenida_texto"}],[{text:"👁️ Preview",callback_data:"preview_start"}],[{text:"⬅️ Volver",callback_data:"back_admin"}]]}}); });

  bot.action('panel_botones', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); await ctx.editMessageText("🧩 BOTONES - Nombre, color, premium",{reply_markup:{inline_keyboard:[[{text:"BIENVENIDA",callback_data:"botones_bienvenida"}],[{text:"GALERIA",callback_data:"botones_galeria"}],[{text:"PLANTILLA",callback_data:"botones_plantilla"}],[{text:"⬅️ Volver",callback_data:"back_admin"}]]}}); });

  bot.action('botones_bienvenida', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); await ctx.editMessageText("BIENVENIDA",{reply_markup:{inline_keyboard:[[{text:"VIRTUAL 🔵 WEDAPP",callback_data:"edit_btn_bienvenida_galeria_virtual"}],[{text:"LISTA 🔴",callback_data:"edit_btn_bienvenida_lista_modelos"}],[{text:"CANAL 🟢",callback_data:"edit_btn_bienvenida_canal_oficial"}],[{text:"⬅️ Volver",callback_data:"panel_botones"}]]}}); });

  bot.action(/edit_btn_(.*)/, async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]=`btn_${ctx.match[1]}`; await ctx.reply(`🧩 Manda para ${ctx.match[1]} en formato:\nTEXTO | primary\nej: VIRTUAL 💖 | primary\nStyles: primary=🔵 danger=🔴 success=🟢`); });

  bot.action('panel_galeria', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); await ctx.editMessageText(`🖼️ GALERIA`,{reply_markup:{inline_keyboard:[[{text:"📸 Foto",callback_data:"edit_galeria_foto"},{text:"📝 Texto",callback_data:"edit_galeria_texto"}],[{text:"⬅️ Volver",callback_data:"back_admin"}]]}}); });
  bot.action('panel_modelos', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let snap=await getDocs(collection(db,"modelos")).catch(()=>({docs:[], size:0})); let kb=[]; let row=[]; snap.docs.slice(0,20).forEach(d=>{ row.push({text:d.data().perfil||d.id,callback_data:`mfoto_${d.id}`}); if(row.length===2){ kb.push(row); row=[]; } }); if(row.length) kb.push(row); kb.push([{text:"⬅️ Volver",callback_data:"back_admin"}]); await ctx.editMessageText(`👸🏻 MODELOS (${snap.size||snap.docs.length})`,{reply_markup:{inline_keyboard:kb}}); });
  bot.action('panel_admins', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); let kb=[]; (c.admins||[]).forEach(id=>{ kb.push([{text:`👑 ${id}`,callback_data:"noop"},{text:"🗑️",callback_data:`admin_del_${id}`} ]); }); kb.push([{text:"➕ Añadir Admin",callback_data:"admin_add"}]); kb.push([{text:"⬅️ Volver",callback_data:"back_admin"}]); await ctx.editMessageText("👑 ADMINS",{reply_markup:{inline_keyboard:kb}}); });

  // todos los edit
  bot.action('edit_bienvenida_foto', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='foto_bienvenida'; await ctx.reply("📸 Manda la foto"); });
  bot.action('edit_bienvenida_texto', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='texto_bienvenida'; await ctx.reply("📝 Texto bienvenida usa {nombre} {usuario}"); });
  bot.action('edit_galeria_foto', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='foto_galeria'; await ctx.reply("📸 Foto galeria"); });
  bot.action('edit_galeria_texto', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='texto_galeria'; await ctx.reply("📝 Texto galeria"); });
  bot.action('edit_plantilla_texto', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='texto_plantilla'; await ctx.reply("📝 Plantilla {perfil} @{username} {edad}"); });
  bot.action('admin_add', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]='add_admin_id'; await ctx.reply("Manda ID admin"); });
  bot.action(/mfoto_(.*)/, async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); esperando[String(ctx.from.id)]=`foto_modelo_${ctx.match[1]}`; await ctx.reply(`Foto para ${ctx.match[1]}`); });
  bot.action('back_admin', async(ctx)=>{ try{ await ctx.answerCbQuery().catch(()=>{}); await ctx.deleteMessage().catch(()=>{}); }catch(e){} await bot.telegram.sendMessage(ctx.from.id,`👑 <b>PANEL ADMIN V14</b> 👑`,{parse_mode:'HTML',reply_markup:{inline_keyboard:[[{text:"👋🏻 BIENVENIDA",callback_data:"panel_bienvenida"},{text:"📝 PLANTILLAS",callback_data:"panel_plantillas"}],[{text:"🖼️ GALERIA",callback_data:"panel_galeria"},{text:"👸🏻 MODELOS",callback_data:"panel_modelos"}],[{text:"👑 ADMINS",callback_data:"panel_admins"},{text:"🧩 BOTONES",callback_data:"panel_botones"}]]}}); });
  bot.action('preview_start', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); let c=await getConfig(); let texto=(c.bienvenida_texto||"Hola {nombre}").replace(/{nombre}/g, ctx.from.first_name).replace(/{usuario}/g, ctx.from.username||""); if(c.bienvenida_media){ try{ await ctx.replyWithPhoto(c.bienvenida_media,{caption:texto,parse_mode:'HTML'}); return; }catch(e){} } await ctx.reply(texto,{parse_mode:'HTML'}); });
  bot.action('noop', async(ctx)=>{ await ctx.answerCbQuery().catch(()=>{}); });
};
