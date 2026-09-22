// src/handlers/index.js - CORRECTO v14
module.exports = (bot) => {
  require('./text')(bot);
  require('./galeria')(bot);
  require('./admin')(bot);
  console.log('✅ Handlers cargados: text, galeria, admin');
};
