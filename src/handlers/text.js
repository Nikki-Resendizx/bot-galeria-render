const { bot } = require('../bot');
const { doc, setDoc, collection, addDoc } = require('firebase/firestore');
const { db } = require('../firebase');
const { clearCache, getConfig } = require('../cache');
const { esperando } = require('./admin');

bot.on('text', async(ctx)=>{
  let key=String(ctx.from.id);
  if(!esperando[key]) return;
  let txt=ctx.message.text;
  let entities=ctx.message.entities||[];

  // TEXTOS
  if(esperando[key]==='texto_bienvenida'){
    await setDoc(doc(db,"config","bot"),{bienvenida_texto:txt,bienvenida_entities:entities},{merge:true});
    clearCache(); delete esperando[key];
    await ctx.reply("✅ Texto bienvenida PREMIUM guardado",{parse_mode:'HTML'});
  } else if(esperando[key]==='texto_galeria'){
    await setDoc(doc(db,"config","bot"),{galeria_texto:txt,galeria_entities:entities},{merge:true});
    clearCache(); delete esperando[key];
    await ctx.reply("✅ Texto galería guardado");
  } else if(esperando[key]==='texto_plantilla'){
    await addDoc(collection(db,"plantillas"),{nombre:txt.slice(0,20),texto:txt,entities,created:Date.now()});
    await setDoc(doc(db,"config","bot"),{plantilla_texto:txt,plantilla_entities:entities},{merge:true});
    clearCache(); delete esperando[key];
    await ctx.reply("✅ Plantilla PREMIUM guardada con entities");
  } else if(esperando[key]==='add_admin_id'){
    let c=await getConfig(); let admins=c.admins||[]; if(!admins.includes(txt)) admins.push(txt);
    await setDoc(doc(db,"config","bot"),{admins},{merge:true});
    clearCache(); delete esperando[key];
    await ctx.reply(`✅ Admin ${txt} agregado`);
  } else if(esperando[key]==='galeria_colores'){
    let partes=txt.split(' '); let c1=partes[0]||"🔵"; let c2=partes[1]||"🔴";
    await setDoc(doc(db,"config","bot"),{botones:{galeria:{modelo_color_1:c1,modelo_color_2:c2}}},{merge:true});
    clearCache(); delete esperando[key];
    await ctx.reply(`✅ Colores ${c1} ${c2} guardados`);
  } else if(esperando[key].startsWith('btn_')){
    // EDITOR DE BOTONES PREMIUM
    let btnKey=esperando[key].replace('btn_',''); // bienvenida_galeria_virtual
    let path=btnKey.split('_'); // ["bienvenida","galeria","virtual"] etc
    // Guardamos texto con entities premium
    let seccion=path[0]; let campo=path.slice(1).join('_');
    let update={};
    update[`botones.${seccion}.${campo}.text`]=txt;
    update[`botones.${seccion}.${campo}.entities`]=entities;
    // Firebase no acepta dot, usamos setDoc merge manual
    let cfg=await getConfig();
    if(!cfg.botones) cfg.botones={}; if(!cfg.botones[seccion]) cfg.botones[seccion]={}; if(!cfg.botones[seccion][campo]) cfg.botones[seccion][campo]={};
    cfg.botones[seccion][campo].text=txt; cfg.botones[seccion][campo].entities=entities;
    await setDoc(doc(db,"config","bot"),{botones:cfg.botones},{merge:true});
    clearCache(); delete esperando[key];
    await ctx.reply(`✅ Botón ${btnKey} guardado como:\n`,{parse_mode:'HTML'});
    await ctx.reply(txt, { entities, parse_mode:'HTML' });
  }
});
