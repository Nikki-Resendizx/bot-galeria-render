const fs = require('fs');
const path = '/tmp/database.json';

let data = { usuarios: {}, bienvenidas: {} };

// Intenta cargar si ya existe
try {
  if(fs.existsSync(path)){
    data = JSON.parse(fs.readFileSync(path, 'utf8'));
  }
} catch(e){
  console.log("Creando DB nueva");
}

function guardar() {
  try{
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log("💾 Guardado en nube TG /tmp");
  }catch(e){
    console.log("Error guardando", e.message);
  }
}

module.exports = {
  saveUser: (id, info) => {
    data.usuarios[id] = {...data.usuarios[id],...info, fecha: new Date().toISOString() };
    guardar();
    return data.usuarios[id];
  },
  getUser: (id) => data.usuarios[id] || null,
  saveBienvenida: (texto) => {
    data.bienvenidas['general'] = texto;
    guardar();
  },
  getBienvenida: () => data.bienvenidas['general'] || null,
  getAll: () => data
};
