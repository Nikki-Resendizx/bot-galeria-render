const { getModelos, getModelo, voteModelo, getModelBotMedia } = require('../config/db');
const { getConfig } = require('../cache');
const { escapeHtml, replaceVars } = require('../utils');
const { Markup } = require('telegraf');
const { button, urlButton, webAppButton } = require('../buttons');

function getModelName(m) {
  return m.perfil || m.nombre || m.username || 'Modelo';
}

// Telegram no permite fijar un ancho CSS a los botones inline.
// Limitamos el texto y usamos una columna para que la fila nunca se expanda
// más que el ancho disponible de la foto/caption en los clientes de Telegram.
function getButtonModelName(m) {
  const name = String(getModelName(m)).trim();
  return name.length > 22 ? name.slice(0, 21).trimEnd() + '…' : name;
}

async function sendLista(ctx) {
  // La lista debe depender únicamente de Firestore + Telegram.
  // La configuración, emojis premium, colores y foto son opcionales y
  // nunca deben impedir que se envíen los modelos.
  let list = [];
  try {
    list = await getModelos();
  } catch (e) {
    console.error('LISTA: error leyendo colección modelos:', e);
    return ctx.reply('❌ No pude leer las modelos de Firebase. Revisa la colección "modelos" y los logs de Render.');
  }

  list = Array.isArray(list) ? list : Object.values(list || {});
  list = list.filter(m => m && m.id !== undefined && m.id !== null);

  if (!list.length) {
    return ctx.reply('⏳ Aún no hay modelos registrados.');
  }

  let config = {};
  try {
    config = await getConfig();
  } catch (e) {
    console.error('LISTA: configuración opcional no disponible:', e.message || e);
  }

  // Los botones de modelos se construyen primero en formato estándar.
  // Esto garantiza que una función avanzada de Telegram no bloquee la lista.
  const keyboard = [];
  let row = [];

  for (const model of list) {
    const name = getButtonModelName(model);
    row.push({
      text: name || 'Modelo',
      callback_data: 'ver_' + String(model.id)
    });

    if (row.length === 2) {
      keyboard.push(row);
      row = [];
    }
  }
  if (row.length) keyboard.push(row);

  // Botones inferiores opcionales.
  const legacyGallery = config.botones?.galeria || {};
  const canal = legacyGallery.canal_oficial || {};
  const canalUrl = canal.url || process.env.CANAL_FREE_URL || process.env.CANAL_OFICIAL_URL || '';
  const webUrl = process.env.WEBAPP_URL || '';

  if (canalUrl) {
    keyboard.push([{ text: '📢 Canal OFICIAL', url: String(canalUrl) }]);
  }
  if (webUrl) {
    keyboard.push([{ text: '💎 Galería Virtual', web_app: { url: String(webUrl) } }]);
  }
  keyboard.push([
    { text: '↩️ Volver', callback_data: 'public_modelos' },
    { text: '🏠 Inicio', callback_data: 'inicio' }
  ]);

  // Texto de galería: si la configuración está dañada, usamos el texto
  // predeterminado y seguimos enviando la lista.
  let texto = '👑 GALERÍA\nElige una chica 👇';
  try {
    texto = replaceVars(config.galeria_texto || texto, ctx);
  } catch (e) {
    console.error('LISTA: error en texto de galería:', e.message || e);
  }

  const markup = { reply_markup: { inline_keyboard: keyboard } };
  const media = config.galeria_media || config.galeria_media_file_id || config.galeria_media_url || '';

  // Primero intentamos la presentación configurada con foto.
  if (media) {
    try {
      return await ctx.replyWithPhoto(media, {
        caption: texto,
        parse_mode: 'HTML',
        ...markup
      });
    } catch (e) {
      console.error('LISTA: foto configurada no disponible, usando texto:', e.message || e);
    }
  }

  // Camino principal sin dependencias de foto, premium emoji ni estilos.
  try {
    return await ctx.reply(texto, {
      parse_mode: 'HTML',
      ...markup
    });
  } catch (e) {
    console.error('LISTA: HTML/keyboard falló, usando texto plano:', e.message || e);
    const plain = String(texto || '').replace(/<[^>]*>/g, '');
    return ctx.reply(plain, markup);
  }
}

async function sendModelo(ctx, id) {
  const model = await getModelo(id);

  if (!model) {
    return ctx.reply('❌ Modelo no existe');
  }

  const config = await getConfig();
  let plantilla = config.plantilla_texto ||
    '👑 {perfil} 👑\n@{username}\n{edad} | {nacionalidad}\n\n{Lista_servicios}\n\n{descripcion}\n\n{Votos} votos | {porcentaje_buenos}% buenos';

  // Si existe una plantilla activa, esta tiene prioridad y permite
  // intercambiar el estilo sin tocar cada modelo.
  if (config.plantilla_activa) {
    try {
      const { getPlantillas } = require('../config/db');
      const plantillas = await getPlantillas();
      if (plantillas[config.plantilla_activa]?.texto) {
        plantilla = plantillas[config.plantilla_activa].texto;
      }
    } catch (e) {
      console.error('MODELO: error cargando plantilla activa:', e.message || e);
    }
  }

  const texto = replaceVars(plantilla, ctx, model);
  const media = await getModelBotMedia(id);
  const fileId = media?.file_id;

  const buttons = [
    [await webAppButton('perfil_webapp', (process.env.WEBAPP_URL || '') + '?startapp=m_' + encodeURIComponent(id), { section: 'plantilla', style: 'primary' })],
    [
      await button('votosbueno', { section: 'plantilla', callback_data: 'voto_bueno:' + id, style: 'success' }),
      await button('votosmalos', { section: 'plantilla', callback_data: 'voto_malo:' + id, style: 'danger' })
    ]
  ];

  const canalUrlModel = model.canalFree || model.canal_free || process.env.CANAL_FREE_URL || '';
  const contactoUrlModel = model.contacto || (model.username ? 'https://t.me/' + String(model.username).replace(/^@/, '') : '');
  const contactRow = [];
  if (canalUrlModel) contactRow.push(await urlButton('canal_free', canalUrlModel, { section: 'plantilla', style: 'primary' }));
  if (contactoUrlModel) contactRow.push(await urlButton('contactar', contactoUrlModel, { section: 'plantilla', style: 'primary' }));
  if (contactRow.length) buttons.push(contactRow);

  buttons.push([
    await button('volver', { section: 'plantilla', callback_data: 'public_modelos', style: 'primary' }),
    await button('inicio', { section: 'plantilla', callback_data: 'inicio', style: 'primary' })
  ]);

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

const registerModelos = bot => {
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
    try { await ctx.deleteMessage().catch(() => {}); } catch (_) {}
    try {
      return await sendLista(ctx);
    } catch (e) {
      console.error('LISTA: fallo final en public_modelos:', e.message || e);
      return ctx.reply('❌ No pude cargar la lista de modelos. Usa /modelos para reintentar.');
    }
  });

  // Compatibilidad con el diseño del bot Vercel.
  bot.action('lista', async ctx => {
    await ctx.answerCbQuery().catch(() => {});
    try { await ctx.deleteMessage().catch(() => {}); } catch (_) {}
    try {
      return await sendLista(ctx);
    } catch (e) {
      console.error('LISTA: fallo final en lista:', e.message || e);
      return ctx.reply('❌ No pude cargar la lista de modelos. Usa /modelos para reintentar.');
    }
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
      const modelAfter = await getModelo(id);

      await ctx.answerCbQuery(type === 'bueno' ? '👍 Voto registrado' : '👎 Voto registrado');

      const bueno = Number(modelAfter?.votosBueno || 0);
      const malo = Number(modelAfter?.votosMalo || 0);
      const total = bueno + malo;
      const emoji = type === 'bueno' ? '👍🏻' : '👎🏻';
      const tipoTexto = type === 'bueno' ? 'BUENO' : 'MALO';
      const username = ctx.from?.username ? '@' + ctx.from.username : 'ID:' + String(ctx.from?.id || '?');
      const canalId = process.env.CANAL_ID || '-1004377732507';

      try {
        await ctx.telegram.sendMessage(
          canalId,
          emoji + ' VOTO ' + tipoTexto + '\n' +
          '👑 ' + String(modelAfter?.perfil || id) + ' (@' + String(modelAfter?.username || '').replace(/^@/, '') + ')\n' +
          '📊 Total: ' + total + '\n' +
          '👤 ' + username + ' ID:' + String(ctx.from?.id || '?')
        );
      } catch (notifyError) {
        console.error('Error avisando voto al canal:', notifyError.message || notifyError);
      }

      return ctx.reply(
        emoji + ' Voto registrado. Total de este tipo: ' + n + '\n' +
        '📊 Total de votos: ' + total
      );
    } catch (e) {
      console.error('Error voto bot:', e);
      return ctx.answerCbQuery('No se pudo registrar el voto', { show_alert: true });
    }
  });
};

registerModelos.sendLista = sendLista;
registerModelos.sendModelo = sendModelo;

module.exports = registerModelos;
