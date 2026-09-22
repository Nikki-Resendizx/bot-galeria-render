const adminHandler = require('./admin');
const textHandler = require('./text');
const galeriaHandler = require('./galeria');

module.exports = (bot) => {
  // Inyectamos bot a admin para usarlo en callbacks
  adminHandler(bot);
  textHandler(bot);
  galeriaHandler(bot);

  console.log("✅ Handlers cargados v14");
};
