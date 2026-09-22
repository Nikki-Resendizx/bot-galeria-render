const { db } = require('../firebase');
const { doc, setDoc, collection, getDocs, deleteDoc } = require('firebase/firestore');
const { getConfig, clearCache } = require('../cache');
const adminHandler = require('./admin');

module.exports = (bot) => {
  // Ahora si agarra el objeto correcto
  const esperando = adminHandler.esperando;

  bot.on('message', async (ctx, next) => {
    const uid = String(ctx.from.id);
    const estado = esperando[uid];
    if (!estado) return next();

    try {
      // FOTO BIENVENIDA
      if (estado === 'foto_bienvenida' && ctx.message.photo) {
        const fileId = ctx.message.photo[ctx.message.photo.length-1].file_id;
        const cfgFile = await bot.telegram.getFile(fileId).catch(()=>null);
        const link = cfgFile? `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${cfgFile.file_path}` : fileId;
        await setDoc(doc(db,"config","bot"),{bienvenida_media: link},{merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply("✅ Foto bienvenida guardada");
      }
      // TEXTO BIENVENIDA
      if (estado === 'texto_bienvenida' && ctx.message.text) {
        await setDoc(doc(db,"config","bot"),{bienvenida_texto: ctx.message.text},{merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply("✅ Texto bienvenida guardado");
      }
      // FOTO GALERIA
      if (estado === 'foto_galeria' && ctx.message.photo) {
        const fileId = ctx.message.photo[ctx.message.photo.length-1].file_id;
        const cfgFile = await bot.telegram.getFile(fileId).catch(()=>null);
        const link = cfgFile? `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${cfgFile.file_path}` : fileId;
        await setDoc(doc(db,"config","bot"),{galeria_media: link},{merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply("✅ Foto galeria guardada");
      }
      // TEXTO GALERIA
      if (estado === 'texto_galeria' && ctx.message.text) {
        await setDoc(doc(db,"config","bot"),{galeria_texto: ctx.message.text},{merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply("✅ Texto galeria guardado");
      }
      // TEXTO PLANTILLA
      if (estado === 'texto_plantilla' && ctx.message.text) {
        await setDoc(doc(db,"config","bot"),{plantilla_texto: ctx.message.text},{merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply("✅ Plantilla guardada");
      }
      // BOTONES - BIENVENIDA, GALERIA, PLANTILLA
      if (estado.startsWith('btn_') && ctx.message.text) {
        if(!ctx.message.text.includes('|')){
          return ctx.reply("❌ Formato mal. Usa: TEXTO | primary\nej: VER GALERÍA 💖 | primary");
        }
        const parts = ctx.message.text.split('|');
        const text = parts[0].trim();
        const style = (parts[1]||'primary').trim().toLowerCase();
        const keyFull = estado.replace('btn_',''); // bienvenida_galeria_virtual

        let area = 'bienvenida';
        if(keyFull.startsWith('galeria_')) area = 'galeria';
        if(keyFull.startsWith('plantilla_')) area = 'plantilla';

        let k = keyFull;
        if(area === 'bienvenida') k = keyFull.replace('bienvenida_','');
        if(area === 'galeria') k = keyFull.replace('galeria_','');
        if(area === 'plantilla') k = keyFull.replace('plantilla_','');

        const cfgDoc = await getConfig();
        let botones = cfgDoc.botones || {};
        if(!botones[area]) botones[area] = {};
        botones[area][k] = { text, style };

        await setDoc(doc(db,"config","botones"), botones, {merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply(`✅ Botón [${area}] ${k} -> ${text} [${style}]`);
      }
      // ADD ADMIN
      if (estado === 'add_admin_id' && ctx.message.text) {
        const id = ctx.message.text.trim().replace(/[^0-9]/g,'');
        if(!id) return ctx.reply("❌ ID inválido, solo números");
        const cfg = await getConfig();
        const admins = [...new Set([...(cfg.admins||[]), id])];
        await setDoc(doc(db,"config","bot"),{admins},{merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply(`✅ Admin ${id} añadido`);
      }
      // FOTO MODELO
      if (estado.startsWith('foto_modelo_') && ctx.message.photo) {
        const modeloId = estado.replace('foto_modelo_','');
        const fileId = ctx.message.photo[ctx.message.photo.length-1].file_id;
        const cfgFile = await bot.telegram.getFile(fileId).catch(()=>null);
        const link = cfgFile? `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${cfgFile.file_path}` : fileId;
        await setDoc(doc(db,"modelos", modeloId),{foto: link, foto_file_id: fileId},{merge:true});
        clearCache();
        delete esperando[uid];
        return ctx.reply(`✅ Foto modelo ${modeloId} guardada`);
      }

    } catch(e){
      console.log("Error textHandler:", e);
      return ctx.reply("❌ Error: "+e.message);
    }
    return next();
  });
};
