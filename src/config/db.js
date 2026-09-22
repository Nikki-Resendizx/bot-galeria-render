const { db, admin } = require('../firebase');
const botDoc = db.collection('config').doc('bot');
async function getConfig() {
  const a=await botDoc.get(), b=await db.collection('config').doc('botones').get(), p=await db.collection('config').doc('premium').get();
  return Object.assign({},a.exists?a.data():{},{botones:b.exists?b.data():{},premium:p.exists?p.data():{activo:true}});
}
async function saveConfig(data){await botDoc.set(data,{merge:true});}
async function saveUser(id,info){await db.collection('usuarios').doc(String(id)).set(Object.assign({},info,{id:String(id),actualizado:admin.firestore.FieldValue.serverTimestamp()}),{merge:true});}
async function getPlantillas(){const s=await db.collection('plantillas').get(),o={};s.forEach(d=>o[d.id]=Object.assign({id:d.id},d.data()));return o;}
async function savePlantilla(id,data){await db.collection('plantillas').doc(id).set(data,{merge:true});}
async function deletePlantilla(id){await db.collection('plantillas').doc(id).delete();}
async function getModelo(id){const s=await db.collection('modelos').doc(String(id)).get();return s.exists?Object.assign({id:s.id},s.data()):null;}\nasync function getModelos(){const s=await db.collection('modelos').get();return s.docs.map(d=>Object.assign({id:d.id},d.data()));}
async function getBotMedia(){const s=await botDoc.get();return s.exists?((s.data()||{}).media||{}):{};}
async function saveBotMedia(key,fileId){await botDoc.set({media:{[key]:fileId}},{merge:true});}
async function saveTemplateMedia(id,fileId){await db.collection('plantillas').doc(String(id)).set({media_file_id:fileId,actualizado:admin.firestore.FieldValue.serverTimestamp()},{merge:true});}
module.exports={db,getConfig,saveConfig,saveUser,getPlantillas,savePlantilla,deletePlantilla,getModelo,getModelos,getBotMedia,saveBotMedia,saveTemplateMedia};