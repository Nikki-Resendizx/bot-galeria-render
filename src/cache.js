const { doc, getDoc, collection, getDocs } = require('firebase/firestore');
const { db } = require('./firebase');
const { DEFAULT_BOTONES } = require('./config');
let cache={config:null,time:0,modelos:null,mtime:0};
const CACHE_MS=5*60*1000;
async function getConfig(){
  if(cache.config && Date.now()-cache.time<CACHE_MS) return cache.config;
  try{
    let s=await getDoc(doc(db,"config","bot"));
    if(s.exists()){
      let d=s.data();
      d.botones={...DEFAULT_BOTONES,...(d.botones||{}), bienvenida:{...DEFAULT_BOTONES.bienvenida,...(d.botones?.bienvenida||{})}, galeria:{...DEFAULT_BOTONES.galeria,...(d.botones?.galeria||{})}, plantilla:{...DEFAULT_BOTONES.plantilla,...(d.botones?.plantilla||{})} };
      cache.config=d; cache.time=Date.now(); return d;
    }
  }catch(e){}
  return { bienvenida_texto:"Hola {mencion} 👑", bienvenida_entities:[], galeria_texto:"👑 GALERIA {mencion}", galeria_entities:[], plantilla_texto:"👑 {perfil} 👑\n@{username}\n{edad} | {nacionalidad}\n\n{Lista_servicios}\n\n{descripcion}\n\n{Votos} votos | {porcentaje_buenos}% buenos {porcentaje_malos}% malos", plantilla_entities:[], bienvenida_media:null, galeria_media:null, admins:[], botones:DEFAULT_BOTONES };
}
async function getModelos(){
  if(cache.modelos && Date.now()-cache.mtime<CACHE_MS) return cache.modelos;
  try{ let snap=await getDocs(collection(db,"modelos")); cache.modelos=snap; cache.mtime=Date.now(); return snap; }catch(e){ return cache.modelos||{size:0,docs:[],forEach:()=>{}}; }
}
function clearCache(){ cache.config=null; cache.modelos=null; }
module.exports={ getConfig, getModelos, clearCache };
