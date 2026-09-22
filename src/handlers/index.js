const startHandler = require('./start');
const adminHandler = require('./admin');
const plantillasHandler = require('./plantillas');
const modelosHandler = require('./modelos');
const galeriaHandler = require('./galeria');
const textHandler = require('./text');

module.exports = (bot) => {
  console.log("✅ Cargando handlers V16.1 Nube TG...");
  startHandler(bot);
  adminHandler(bot);
  plantillasHandler(bot);
  modelosHandler(bot);
  galeriaHandler(bot);
  textHandler(bot);
  console.log("✅ Todos los handlers cargados");
};
