const { bot } = require('../bot');
const { doc, setDoc, collection, addDoc } = require('firebase/firestore');
const { db } = require('../firebase');
const { clearCache, getConfig } = require('../cache');
const { esperando } = require('./admin');

const MAP = { r:'danger', g:'success', p:'primary', b:'primary', rojo:'danger', verde:'success', azul:'primary' };

function contarPremium(entities){ return (entities||[]).filter(e=>e.type==='custom_emoji').length; }

function parseBoton(txt, entities){
  // #g 💎 CANAL OFICIAL 
-> Guarda: style: success (verde) + icon_custom_emoji_id: ID de 💎 + text: CANAL OFICIAL
  let color=''; let rest=txt.trim();
  let m=rest.match(/^#(r|g|b|p|rojo|verde|azul)\s+/i);
  if(m){
    let code=m[1].toLowerCase();
    color=COLORES[code]||'';
    rest=rest.slice(m[0].length).trim(); // queda "💎 CANAL OFICIAL"
  }
  // Ajustar offset de entities después de quitar #g
  let offset = txt.length - rest.length - (m?0:0);
  if(m){
    let cut=m[0].length;
    entities=(entities||[]).map(e=>{
      return {...e, offset: e.offset - cut};
    }).filter(e=>e.offset>=0);
  }
  let total=contarPremium(entities);
  // Solo 1 premium permitido
  let premiumId = (entities.find(e=>e.type==='custom_emoji')||{}).custom_emoji_id||null;

  return { color, texto: rest, entities, totalPremium: total, premiumId };
}

bot.on('text', async(ctx)=>{
  let key=String(ctx.from.id);
  if(!esperando[key]) return;
  let txt=ctx.message.text;
  let entities=ctx.message.entities||[];

  // TEXTOS NORMALES
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

  // EDITOR DE BOTONES CON SINTAXIS #r #g #p
  if(esperando[key].startsWith('btn_')){
    let btnKey=esperando[key].replace('btn_',''); // ej bienvenida_galeria_virtual
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
    if(!cfg.botones) cfg.botones={}; if(!cfg.botones[seccion]) cfg.botones[seccion]={}; if(!cfg.botones[seccion][campo]) cfg.botones[seccion][campo]={};

    cfg.botones[seccion][campo].text = texto;
    cfg.botones[seccion][campo].entities = ents;
    cfg.botones[seccion][campo].color = color||cfg.botones[seccion][campo].color||'';
    cfg.botones[seccion][campo].premiumId = premiumId||'';
    cfg.botones[seccion][campo].raw = txt; // guardamos ejemplo original

    await setDoc(doc(db,"config","bot"),{botones:cfg.botones},{merge:true});
    clearCache(); delete esperando[key];

    let msg=`🧩 BOTON ${campo.toUpperCase()} GUARDADO\n`;
    if(color) msg+=`Color: ${color} (${Object.keys(COLORES).find(k=>COLORES[k]===color)}) \n`;
    msg+=`Premium: ${totalPremium>0?'✅ SI':'❌ NO'} (${totalPremium})\n`;
    msg+=`Texto: ${texto}`;

    await ctx.reply(msg,{parse_mode:'HTML'});
    // replica exacta como se verá
    await ctx.reply(texto,{entities:ents,parse_mode:'HTML'});
    return;
  }
});
