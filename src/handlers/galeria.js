const { getConfig } = require('../cache');
const { replaceVars } = require('../utils');

module.exports = (bot) => {
  bot.command('galeria', async(ctx)=>{
    try {
      const cfg = await getConfig();
      const texto = cfg.galeria_texto || "🖼️ <b>GALERÍA VIRTUAL PREMIUM</b>\n\nEntra a ver todo el contenido exclusivo 💖";
      const finalTexto = replaceVars(texto, ctx);
      
      const botonesCfg = cfg.botones?.galeria || {};
      // Botones dinámicos desde Firebase, con fallback
      const btn1 = botonesCfg.ver_contenido || { text: "💖 VER CONTENIDO 💖", style: "primary" };
      const btn2 = botonesCfg.lista_modelos || { text: "👑 LISTA MODELOS 👑", style: "danger" };

      const webappUrl = process.env.WEBAPP_URL || "https://tu-webapp.com";
      
      await ctx.reply(finalTexto, {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: btn1.text, web_app: { url: webappUrl } }],
            [{ text: btn2.text, callback_data: "ver_modelos" }],
            [{ text: "💎 CANAL OFICIAL 💎", url: process.env.CANAL_OFICIAL || "https://t.me/tu_canal" }]
          ]
        }
      });
    } catch(e) {
      console.log("Error galeria:", e);
      await ctx.reply("🖼️ Galería virtual: "+ (process.env.WEBAPP_URL||"link no configurado"));
    }
  });

  bot.action('ver_modelos', async(ctx)=>{
    await ctx.answerCbQuery().catch(()=>{});
    return ctx.reply("👑 Usa /modelos para ver la lista");
  });
};
