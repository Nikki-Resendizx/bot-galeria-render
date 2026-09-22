const { getModelos, getModelo, voteModelo, getModelBotMedia } = require('../config/db');
const { getConfig } = require('../cache');
const { escapeHtml, replaceVars } = require('../utils');
const { Markup } = require('telegraf');
const { button, urlButton, webAppButton } = require('../buttons');

function getModelName(m) {
  return m.perfil || m.nombre || m.username || 'Modelo';
}

async function sendLista(ctx) {
  const config = await getConfig();
  const list = await getModelos();

  if (!list.length) {
    return ctx.reply('⏳ Aún no hay modelos');
  }

  // Mantener el orden más reciente primero cuando existe "fecha".
  list.sort((a, b) => {
    const da = a.fecha?.toDate ? a.fecha.toDate().getTime() : new Date(a.fecha || 0).getTime();
    const db = b.fecha?.toDate ? b.fecha.toDate().getTime() : new Date(b.fecha || 0).getTime();
    return db - da;
  });

  const template = config.galeria_texto || '👑 GALERÍA {mencion}\nElige una chica 👇';
  const texto = replaceVars(template, ctx);
  const keyboard = [];
  let row = [];

  list.forEach((m, index) => {
    const style = index % 2 === 0 ? 'primary' : 'danger';

    const btn = {
      text: getModelName(m),
      callback_data: 'ver_' + m.id,
      style
    };

    if (config.galeria_emoji_premium) {
      btn.icon_custom_emoji_id = String(config.galeria_emoji_premium);
    }

    row.push(btn);

    if (row.length === 2) {
      keyboard.push(row);
      row = [];
    }
  });

  if (row.length) keyboard.push(row);

  // Botones inferiores: conservamos la configuración actual y también
  // aceptamos la estructura antigua del bot de Vercel.
  const legacyGallery = config.botones?.galeria || {};
  const canal = legacyGallery.canal_oficial || {};
  const web = legacyGallery.galeria_virtual || {};

  const canalUrl = canal.url || process.env.CANAL_FREE_URL || process.env.CANAL_OFICIAL_URL || '';
  const webUrl = process.env.WEBAPP_URL || '';

  if (canalUrl) {
    keyboard.push([{
      text: canal.text || 'CANAL OFICIAL',
      url: canalUrl,
      style: ['primary', 'success', 'danger'].includes(String(canal.color || '').toLowerCase())
        ? String(canal.color).toLowerCase()
        : 'success',
      ...(canal.premiumId ? { icon_custom_emoji_id: String(canal.premiumId) } : {})
    }]);
  }

  if (webUrl) {
    keyboard.push([{
      text: web.text || 'ABRIR GALERÍA WEB',
      web_app: { url: webUrl },
      style: ['primary', 'success', 'danger'].includes(String(web.color || '').toLowerCase())
        ? String(web.color).toLowerCase()
        : 'primary',
      ...(web.premiumId ? { icon_custom_emoji_id: String(web.premiumId) } : {})
    }]);
  }

  keyboard.push([
    { text: '🏠 Inicio', callback_data: 'inicio', style: 'primary' }
  ]);

  const markup = { reply_markup: { inline_keyboard: keyboard } };

  const media = config.galeria_media || config.galeria_media_file_id || config.galeria_media_url || '';

  if (media) {
    try {
      return await ctx.replyWithPhoto(media, {
        caption: texto,
        parse_mode: 'HTML',
        ...markup
      });
    } catch (e) {
      console.error('LISTA: error enviando foto de galería:', e.message || e);
    }
  }

  return ctx.reply(texto, {
    parse_mode: 'HTML',
    ...markup
  });
}

async function sendModelo(ctx, id) {
  const model = await getModelo(id);

  if (!model) {
    return ctx.reply('❌ Modelo no existe');
  }

  const config = await getConfig();
  const plantilla = config.plantilla_texto ||
    '👑 {perfil} 👑\n@{username}\n{edad} | {nacionalidad}\n\n{Lista_servicios}\n\n{descripcion}\n\n{Votos} votos | {porcentaje_buenos}% buenos';

  const texto = replaceVars(plantilla, ctx, model);
  const media = await getModelBotMedia(id);
  const fileId = media?.file_id;

  const buttons = [
    [{
      text: 'VER PERFIL COMPLETO',
      web_app: { url: (process.env.WEBAPP_URL || '') + '/perfil.html?id=' + encodeURIComponent(id) },
      style: 'primary'
    }],
    [
      await button('bueno', { callback_data: 'voto_bueno:' + id }),
      await button('malo', { callback_data: 'voto_malo:' + id })
    ],
    [
      await urlButton('canal_free', model.canalFree || process.env.CANAL_FREE_URL || '', { style: 'primary' }),
      await urlButton('contacto', model.contacto || process.env.CANAL_FREE_URL || '', { style: 'primary' })
    ],
    [
      { text: '◀️ VOLVER', callback_data: 'public_modelos', style: 'primary' },
      { text: '🏠 INICIO', callback_data: 'inicio', style: 'primary' }
    ]
  ];

  const markup = Markup.inlineKeyboard(buttons);

  if (fileId) {
    try {
      return await ctx.replyWithPhoto(fileId, {
        caption: texto,
        parse_mode: 'HTML',
        ...markup
      });
    } catch (e) {
      console.error('MODELO: error enviando foto:', e.message || e);
    }
  }

  return ctx.reply(texto, {
    parse_mode: 'HTML',
    ...markup
  });
}

module.exports = bot => {
  // Lista: ya no envía todas las modelos juntas.
  // Primero muestra botones de 2 en 2 y solo carga la modelo seleccionada.
  bot.command('modelos', async ctx => {
    try {
      return await sendLista(ctx);
    } catch (e) {
      console.error('Error lista modelos:', e);
      return ctx.reply('❌ No pude cargar la lista de modelos.');
    }
  });

  bot.action('public_modelos', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    try {
      await ctx.deleteMessage().catch(() => {});
    } catch (e) {}
    return sendLista(ctx);
  });

  // Compatibilidad con el diseño del bot Vercel.
  bot.action('lista', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    try {
      await ctx.deleteMessage().catch(() => {});
    } catch (e) {}
    return sendLista(ctx);
  });

  bot.action(/^ver_(.+)$/, async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    try {
      await ctx.deleteMessage().catch(() => {});
    } catch (e) {}
    return sendModelo(ctx, ctx.match[1]);
  });

  bot.action(/^voto_(bueno|malo):(.+)$/, async ctx => {
    try {
      const type = ctx.match[1];
      const id = ctx.match[2];
      const n = await voteModelo(id, type);
      await ctx.answerCbQuery(type === 'bueno' ? '👍 Voto registrado' : '👎 Voto registrado');
      return ctx.reply(
        (type === 'bueno' ? '👍' : '👎') +
        ' Voto registrado. Total de este tipo: ' + n
      );
    } catch (e) {
      console.error('Error voto bot:', e);
      return ctx.answerCbQuery('No se pudo registrar el voto', { show_alert: true });
    }
  });
};
