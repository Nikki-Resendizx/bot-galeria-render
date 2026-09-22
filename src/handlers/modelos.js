const axios = require('axios');

module.exports = (bot) => {
  bot.command('modelos', async (ctx) => {
    try{
      const WEBAPP = process.env.WEBAPP_URL;
      const res = await axios.get(`${WEBAPP}/api/modelos?t=${Date.now()}`);
      const modelos = res.data;

      if(!modelos || modelos.length === 0){
        return ctx.reply("😔 Aún no hay modelos cargadas, mi reina. Ve al panel admin de la web.");
      }

      for(const m of modelos){
        const caption = `👸🏻 <b>${m.nombre}</b>\n\n${m.descripcion || ''}\n\n⭐ ${m.promedio || 0} (${m.totalVotos || 0} votos)\n\n🔗 <a href="${WEBAPP}/modelo/${m.id}">Ver más y votar</a>`;
        try{
          if(m.foto){
            await ctx.replyWithPhoto(m.foto, { caption, parse_mode:'HTML' });
          }else{
            await ctx.reply(caption, { parse_mode:'HTML' });
          }
        }catch(e){
          await ctx.reply(caption, { parse_mode:'HTML' });
        }
        await new Promise(r=>setTimeout(r,800));
      }
    }catch(e){
      console.log("Error modelos:", e.message);
      ctx.reply("⚠️ Error cargando modelos. Intenta más tarde.");
    }
  });
};
