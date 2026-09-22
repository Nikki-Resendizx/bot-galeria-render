const fs = require('fs');
const path = require('path');
const DB_PATH = '/tmp/database.json';

function loadDB(){
  try{
    if(!fs.existsSync(DB_PATH)){
      return { users:{}, modelos:[], plantillas:{}, bienvenida:'', botones:[], galeria:[] };
    }
    return JSON.parse(fs.readFileSync(DB_PATH,'utf8'));
  }catch(e){
    return { users:{}, modelos:[], plantillas:{}, bienvenida:'', botones:[], galeria:[] };
  }
}
function saveDB(data){
  try{ fs.writeFileSync(DB_PATH, JSON.stringify(data,null,2)); }catch(e){}
}

// USERS
function saveUser(id, info){ const db=loadDB(); db.users[id]=info; saveDB(db); }
function getUsers(){ return loadDB().users; }

// BIENVENIDA
function saveBienvenida(texto){ const db=loadDB(); db.bienvenida=texto; saveDB(db); }
function getBienvenida(){ return loadDB().bienvenida; }

// PLANTILLAS
function savePlantilla(nombre, texto){ const db=loadDB(); db.plantillas[nombre]=texto; saveDB(db); }
function getPlantillas(){ return loadDB().plantillas; }
function getPlantilla(nombre){ return loadDB().plantillas[nombre]; }

// MODELOS (foto, nombre, descripcion, etc)
function saveModelos(modelos){ const db=loadDB(); db.modelos=modelos; saveDB(db); }
function getModelos(){ return loadDB().modelos || []; }
function addModelo(m){ const db=loadDB(); db.modelos.push(m); saveDB(db); }
function deleteModelo(id){ const db=loadDB(); db.modelos=db.modelos.filter(x=>x.id!=id); saveDB(db); }

// GALERIA
function getGaleria(){ return loadDB().galeria || []; }
function saveGaleria(g){ const db=loadDB(); db.galeria=g; saveDB(db); }

// BOTONES PREMIUM
function getBotones(){ return loadDB().botones || []; }
function saveBotones(b){ const db=loadDB(); db.botones=b; saveDB(db); }

module.exports = {
  loadDB, saveDB,
  saveUser, getUsers,
  saveBienvenida, getBienvenida,
  savePlantilla, getPlantillas, getPlantilla,
  saveModelos, getModelos, addModelo, deleteModelo,
  getGaleria, saveGaleria,
  getBotones, saveBotones
};
