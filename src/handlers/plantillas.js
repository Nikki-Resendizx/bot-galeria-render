const { savePlantilla, saveBienvenida, addModelo, deleteModelo, saveBotones, getBotones, saveGaleria, getGaleria } = require('../config/db');

module.exports = (bot) => {
  bot.command('bienvenida', (ctx) => {
    if(String(ctx.from.id)!== String(process.env.ADMIN_ID)) return;
    const texto = ctx.message.text.replace('/bienvenida','').trim();
    if(!texto) return ctx.reply("Uso: /bienvenida Hola 👸🏻 bienvenida ✨");
    saveBienvenida(texto);
    ctx.reply("✅ Bienvenida guardada en nube TG con emojis premium 💌");
  });

  bot.command('plantilla', (ctx) => {
    if(String(ctx.from.id)!== String(process.env.ADMIN_ID)) return;
    const parts = ctx.message.text.replace('/plantilla','').trim().split('|');
    if(parts.length<2) return ctx.reply("Uso: /plantilla nombre | texto con emojis 🌸");
    savePlantilla(parts[0].trim(), parts[1].trim());
    ctx.reply(`✅ Plantilla ${parts[0].trim()} guardada en TG`);
  });

  bot.command('addmodelo', (ctx) => {
    if(String(ctx.from.id)!== String(process.env.ADMIN_ID)) return;
    const parts = ctx.message.text.replace('/addmodelo','').trim().split('|');
    if(parts.length<1) return ctx.reply("Uso: /addmodelo Nombre | Descripcion con emojis 👸🏻");
    const modelo = { id: Date.now().toString(), nombre: parts[0].trim(), descripcion: parts[1]?.trim() || 'Diva premium ✨', promedio: 5, totalVotos: 0 };
    addModelo(modelo);
    ctx.reply(`✅ Modelo ${modelo.nombre} guardada en nube TG`);
  });

  bot.command('delmodelo', (ctx) => {
    if(String(ctx.from.id)!== String(process.env.ADMIN_ID)) return;
    const id = ctx.message.text.replace('/delmodelo','').trim();
    if(!id) return ctx.reply("Uso: /delmodelo ID");
    deleteModelo(id);
    ctx.reply(`🗑️ Modelo ${id} eliminada de TG`);
  });

  bot.command('addboton', (ctx) => {
    if(String(ctx.from.id)!== String(process.env.ADMIN_ID)) return;
    const parts = ctx.message.text.replace('/addboton','').trim().split('|');
    if(parts.length<3) return ctx.reply("Uso: /addboton 👸🏻 | Texto | pink");
    const botones = getBotones();
    botones.push({ emoji: parts[0].trim(), texto: parts[1].trim(), color: parts[2].trim(), id: Date.now() });
    saveBotones(botones);
    ctx.reply(`✅ Botón premium ${parts[0].trim()} ${parts[1].trim()} guardado en TG`);
  });

  bot.on('photo', (ctx, next) => {
    if(String(ctx.from.id)!== String(process.env.ADMIN_ID)) return next();
    const caption = ctx.message.caption || '';
    if(caption.startsWith('/galeria')){
      const fileId = ctx.message.photo[ctx.message.photo.length-1].file_id;
      const galeria = getGaleria();
      galeria.push({ file_id: fileId, id: Date.now(), caption: caption.replace('/galeria','').trim() });
      saveGaleria(galeria);
      return ctx.reply("🖼️ Foto agregada a galería en nube TG");
    }
    return next();
  });
};
