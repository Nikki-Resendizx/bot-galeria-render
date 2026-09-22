const { doc, getDoc, setDoc } = require('firebase/firestore');
const { db } = require('./firebase');
let memoria = null;
let last = 0;
const TTL = 2*60*1000;

async function getConfig(){
  if(memoria && Date.now()-last < TTL) return memoria;
  try{
    const [b,s,p] = await Promise.all([
      getDoc(doc(db,"config","bot")).catch(()=>({exists:()=>false})),
      getDoc(doc(db,"config","botones")).catch(()=>({exists:()=>false})),
      getDoc(doc(db,"config","premium")).catch(()=>({exists:()=>false}))
    ]);
    const dBot = b.exists()? b.data():{};
    const dBtn = s.exists()? s.data():{};
    const dPre = p.exists()? p.data():{activo:true};
    memoria = {
      bienvenida_texto: dBot.bienvenida_texto || "💖 Hola {mencion} 💖\n\n✨ Bienvenid@ a {perfil} VERIFIED ✨\n\n👑 Contenido exclusivo",
      bienvenida_media: dBot.bienvenida_media || null,
      galeria_texto: dBot.galeria_texto || "🖼️ <b>GALERÍA VIRTUAL</b> 💎",
      galeria_media: dBot.galeria_media || null,
      plantilla_texto: dBot.plantilla_texto || "👸🏻 {perfil}\n💜 @{username} | {edad} años\n\n{descripcion}",
      admins: dBot.admins || ["8719034760"],
      botones: dBtn.bienvenida ? dBtn : { bienvenida:{galeria_virtual:{text:"💖 VIRTUAL GALERIA 💖",style:"primary"}, lista_modelos:{text:"👑 LISTA MODELOS 👑",style:"danger"}, canal_oficial:{text:"💎 CANAL OFICIAL 💎",style:"success"}}, galeria:{ver_contenido:{text:"🔥 VER CONTENIDO 🔥",style:"primary"}}, plantilla:{ver_mas:{text:"💖 VER MÁS 💖",style:"primary"}} },
      premium: dPre,
      ...dBot
    };
    last = Date.now();
    return memoria;
  }catch(e){
    console.log("cache err",e.message);
    return memoria || {bienvenida_texto:"Hola {mencion}", admins:["8719034760"], botones:{}, premium:{activo:true}};
  }
}
function clearCache(){ memoria=null; last=0; }
async function saveConfig(t,d){ await setDoc(doc(db,"config",t),d,{merge:true}); clearCache(); }
module.exports = { getConfig, saveConfig, clearCache };
