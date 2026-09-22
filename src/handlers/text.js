const { db } = require('../firebase');
const { doc, setDoc, collection, addDoc } = require('firebase/firestore');
const { getConfig, saveConfig, clearCache } = require('../cache');
const adminHandler = require('./admin');

module.exports = (bot) => {
  const esperando = adminHandler.esperando;

  bot.on('message', async (ctx, next) => {
    const uid = String(ctx.from.id);
    const estado = esperando[uid];
    if (!estado) return next();

    try {
      // FOTO BIENVENIDA
      if (estado === 'foto_bienvenida' && ctx.message.photo) {
        const fileId = ctx.message.photo[ctx.message.photo.length-1].file_id;
        const link = await bot.telegram.getFileLink(fileId);
        await setDoc(doc(db,"config","bot"),{bienvenida_media: link.href || fileId},{merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply("✅ Foto bienvenida guardada");
      }
      // TEXTO BIENVENIDA
      if (estado === 'texto_bienvenida' && ctx.message.text) {
        await setDoc(doc(db,"config","bot"),{bienvenida_texto: ctx.message.text},{merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply("✅ Texto guardado");
      }
      // BOTONES
      if (estado.startsWith('btn_') && ctx.message.text) {
        const parts = ctx.message.text.split('|');
        const text = parts[0].trim();
        const style = (parts[1]||'primary').trim();
        const keyFull = estado.replace('btn_',''); // bienvenida_galeria_virtual
        const cfg = await getConfig();
        let botones = cfg.botones || { bienvenida: {}, galeria: {}, plantilla: {} };
        // parse
        if(keyFull.startsWith('bienvenida_')) {
          const k = keyFull.replace('bienvenida_','');
          if(!botones.bienvenida) botones.bienvenida={};
          botones.bienvenida[k]={text, style};
        }
        await setDoc(doc(db,"config","botones"), botones, {merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply(`✅ Botón ${keyFull} -> ${text} [${style}]`);
      }
      // ADD ADMIN
      if (estado === 'add_admin_id' && ctx.message.text) {
        const id = ctx.message.text.trim();
        const cfg = await getConfig();
        const admins = [...new Set([...(cfg.admins||[]), id])];
        await setDoc(doc(db,"config","bot"),{admins},{merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply(`✅ Admin ${id} añadido`);
      }

    } catch(e){
      console.log(e);
      return ctx.reply("❌ Error: "+e.message);
    }
    return next();
  });
};
