// src/handlers/text.js - FIX v14 MODULAR - Editor botones #r #g #p + premium
const { doc, setDoc } = require('firebase/firestore');
const { db } = require('../firebase');
const { clearCache, getConfig } = require('../cache');
const { esperando } = require('./admin');

const MAP = {
  r:'danger', g:'success', p:'primary', b:'primary',
  rojo:'danger', verde:'success', azul:'primary'
};

function contarPremium(entities){
  return (entities||[]).filter(e=>e.type==='custom_emoji').length;
}

function parseBoton(txt, entities){
  let color='';
  let rest=txt.trim();
  let m=rest.match(/^#(r|g|b|p|rojo|verde|azul)\s+/i);
  if(m){
    let code=m[1].toLowerCase();
    color=MAP[code]||'';
    rest=rest.slice(m[0].length).trim();
  }
  if(m){
    let cut=m[0].length;
    entities=(entities||[]).map(e=>({...e, offset: e.offset - cut})).filter(e=>e.offset>=0);
  }
  let total=contarPremium(entities);
  let premiumId = (entities.find(e=>e.type==='custom_emoji')||{}).custom_emoji_id||null;
  return { color, texto: rest, entities, totalPremium: total, premiumId };
}

module.exports = (bot) => {

  bot.on('text', async(ctx)=>{
    let key=String(ctx.from.id);
    if(!esperando[key]) return;
    let txt=ctx.message.text;
    let entities=ctx.message.entities||[];

    if(esperando[key]==='texto_bienvenida'){
      await setDoc(doc(db,"config","bot"),{bienvenida_texto:txt,bienvenida_entities:entities},{merge:true});
      clearCache(); delete esperando[key];
      return ctx.reply(`👋🏻 BIENVENIDA GUARDADA, ${contarPremium(entities)} PREMIUM`);
    }
    if(esperando[key]==='texto_galeria'){
      await setDoc(doc(db,"config","bot"),{galeria_texto:txt,galeria_entities:entities},{merge:true});
      clearCache(); delete esperando[key];
      return ctx.reply(`🖼️ GALERIA GUARDADA, ${contarPremium(entities)} PREMIUM`);
    }
    if(esperando[key]==='texto_plantilla'){
      await setDoc(doc(db,"config","bot"),{plantilla_texto:txt,plantilla_entities:entities},{merge:true});
      clearCache(); delete esperando[key];
      await ctx.reply(`📝 PLANTILLA GUARDADA, ${contarPremium(entities)} PREMIUM`);
      return ctx.reply(txt,{entities,parse_mode:'HTML'});
    }

    if(esperando[key].startsWith('btn_')){
      let btnKey=esperando[key].replace('btn_','');
      let seccion=btnKey.split('_')[0];
      let campo=btnKey.split('_').slice(1).join('_');
      let { color, texto, entities: ents, totalPremium, premiumId } = parseBoton(txt, entities);
      if(totalPremium>1){
        return ctx.reply(`❌ Solo 1 emoji premium por botón. Detecté ${totalPremium}. Ejemplo: #g 💎 CANAL OFICIAL`);
      }
      if(!texto){
        return ctx.reply(`❌ Sintaxis: #g 💎 NOMBRE\n#r=🔴 #g=🟢 #p=🔵\nEjemplo: #g 💎 CANAL OFICIAL`);
      }
      let cfg=await getConfig();
      if(!cfg.botones) cfg.botones={};
      if(!cfg.botones[seccion]) cfg.botones[seccion]={};
      if(!cfg.botones[seccion][campo]) cfg.botones[seccion][campo]={};
      cfg.botones[seccion][campo].text = texto;
      cfg.botones[seccion][campo].entities = ents;
      cfg.botones[seccion][campo].color = color||cfg.botones[seccion][campo].color||'';
      cfg.botones[seccion][campo].premiumId = premiumId||'';
      cfg.botones[seccion][campo].raw = txt;
      await setDoc(doc(db,"config","bot"),{botones:cfg.botones},{merge:true});
      clearCache(); delete esperando[key];
      let msg=`🧩 BOTON ${campo.toUpperCase()} GUARDADO\n`;
      if(color) msg+=`Color: ${color}\n`;
      msg+=`Premium: ${totalPremium>0?'✅ SI':'❌ NO'} (${totalPremium})\n`;
      msg+=`Texto: ${texto}`;
      await ctx.reply(msg);
      await ctx.reply(texto,{entities:ents});
      return;
    }
  });

  bot.start((ctx) => ctx.reply('Bienvenido a Galeria Verified 💎 Usa /admin'));

};
