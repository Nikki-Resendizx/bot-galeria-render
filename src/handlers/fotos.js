const { bot } = require('../bot');
const { doc, setDoc } = require('firebase/firestore');
const { db } = require('../firebase');
const { clearCache } = require('../cache');
const { esperando } = require('./admin');

bot.on('photo', async(ctx)=>{
  let key=String(ctx.from.id);
  if(!esperando[key]) return;
  let fileId=ctx.message.photo[ctx.message.photo.length-1].file_id;

  if(esperando[key]==='foto_bienvenida'){
    await setDoc(doc(db,"config","bot"),{bienvenida_media:fileId},{merge:true});
    clearCache(); delete esperando[key];
    await ctx.reply("✅ Foto bienvenida guardada (Telegram Cloud gratis ♾️)");
  } else if(esperando[key]==='foto_galeria'){
    await setDoc(doc(db,"config","bot"),{galeria_media:fileId},{merge:true});
    clearCache(); delete esperando[key];
    await ctx.reply("✅ Foto galería guardada");
  } else if(esperando[key].startsWith('foto_modelo_')){
    let id=esperando[key].replace('foto_modelo_','');
    let s=await (await import('firebase/firestore')).getDoc(doc(db,"modelos",id));
    let fotos=s.exists()?(s.data().fotos||[]):[];
    fotos.push(fileId);
    await setDoc(doc(db,"modelos",id),{fotos},{merge:true});
    clearCache(); delete esperando[key];
    await ctx.reply(`✅ Foto agregada a ${id} (${fotos.length}/10)`);
  }
});
