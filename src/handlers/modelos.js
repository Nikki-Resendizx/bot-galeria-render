// src/handlers/modelos.js - FIX V16
module.exports = (bot) => {
  // Handler vacío para que no crashee
  // Si no usas comando /modelos, déjalo así
  
  // Si quieres que funcione /modelos:
  bot.command('modelos', (ctx) => {
    ctx.reply('👑 Usa la galería: https://galeria-verifiedmodels.pages.dev');
  });

  console.log("✅ modelos handler cargado");
};
