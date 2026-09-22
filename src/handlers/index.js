// src/handlers/index.js
module.exports = (bot) => {
  require('./text');
  require('./galeria');
  require('./admin');
  console.log('✅ Handlers cargados: text, galeria, admin');
};
