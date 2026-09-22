module.exports = (bot) => {
  require('./start')(bot);
  require('./admin')(bot);
  require('./text')(bot);
  require('./galeria')(bot);
  require('./modelos')(bot);
  require('./plantillas')(bot);
  console.log("✅ Handlers V16 cargados v16");
};
