module.exports = (bot) => {
  bot.command('galeria', async(ctx)=>{
    await ctx.reply("🖼️ Galería virtual: "+ (process.env.WEBAPP_URL||"link no configurado"));
  });
};
