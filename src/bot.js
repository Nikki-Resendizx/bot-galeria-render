// 13. AVER AGRAGALE ESTE CÓDIGO - ADAPTADO MODULAR
module.exports = (bot) => {
  bot.on('message', async (ctx, next) => {
    const msg = ctx.message;
    if (msg && msg.text && msg.entities) {
      for (const entity of msg.entities) {
        if (entity.type === 'custom_emoji') {
          const emojiId = entity.custom_emoji_id;
          const emojiPlano = msg.text.substring(entity.offset, entity.offset + entity.length);
          console.log(`¡Emoji Premium detectado!`);
          console.log(`ID único: ${emojiId}`);
          console.log(`Emoji base: ${emojiPlano}`);
          const { esperando } = require('../handlers/admin');
          const key = String(ctx.from?.id||"");
          if (esperando[key]) {
            await ctx.reply(`He leído tu emoji premium. ID: ${emojiId}`, { parse_mode:'HTML' }).catch(()=>{});
            await ctx.reply(`Aquí tienes tu emoji de vuelta: <tg-emoji emoji-id="${emojiId}">${emojiPlano}</tg-emoji>`, { parse_mode:'HTML' }).catch(()=>{});
          }
        }
      }
    }
    if (next) return next();
  });
};
