module.exports = (bot) => {
  const safe = (path) => {
    try {
      require(path)(bot);
      console.log(`✅ ${path} cargado`);
    } catch(e) {
      console.log(`⚠️ Skip ${path}: ${e.message}`);
    }
  };

  safe('./start');
  safe('./admin');
  safe('./text');
  safe('./galeria');
  safe('./modelos');
  safe('./plantillas');
  
  console.log("✅ Handlers V16 cargados v16");
};
