const { getModelos, getModelo, voteModelo, getModelBotMedia, saveModelBotMedia } = require('../config/db');
const { getConfig } = require('../cache');
const { escapeHtml, replaceVars, replaceVarsInRich, isAdmin, prepararTextoTelegram, esRichMessage } = require('../utils');
const { Markup } = require('telegraf');
const { button, urlButton, webAppButton } = require('../buttons');
const { publishModelPhoto, deleteStorageMessage } = require('../storage');

function getModelName(m) {
  return m.perfil || m.nombre || m.username || 'Modelo';
}

function getButtonModelName(m) {
  // IMPORTANTE: el nombre se conserva exactamente como está registrado.
  // No se recorta, no se trunca y no se reduce aunque sobresalga visualmente.
  return String(getModelName(m));
}

async function sendLista(ctx) {
  let list;

  try {
    list = await getModelos();
  } catch (e) {
    console.error('LISTA: error leyendo colección modelos:', e);
    return ctx.reply('❌ No pude leer las modelos de Firebase.');
  }

  if (!Array.isArray(list)) {
    list = Object.values(list || {});
  }

  list = list.filter(model =>
    model &&
    model.id !== undefined &&
    model.id !== null &&
    String(model.id).trim() !== ''
  );

  if (!list.length) {
    return ctx.reply('⏳ Aún no hay modelos registrados.');
  }

  const keyboard = [];
  let row = [];

  for (const model of list) {
    const id = String(model.id);
    const callback = 'ver_' + id;

    if (Buffer.byteLength(callback, 'utf8') > 64) {
      console.error('LISTA: ID de modelo demasiado largo, omitido:', id);
      continue;
    }

    // Filas de 2 modelos:
    // posición 1 = azul / primary
    // posición 2 = rojo / danger
    row.push({
      text: getButtonModelName(model) || 'Modelo',
      style: row.length === 0 ? 'primary' : 'danger',
      callback_data: callback
    });

    if (row.length === 2) {
      keyboard.push(row);
      row = [];
    }
  }

  if (row.length) {
    keyboard.push(row);
  }

  if (!keyboard.length) {
    return ctx.reply('❌ Las modelos tienen IDs no válidos para los botones de Telegram.');
  }

  // Botones inferiores:
  // 🟢 Canal Oficial
  // 🔵 WebApp
  // 🔴 Volver / Inicio
  keyboard.push([
    {
      text: '🟢 Canal Oficial',
      style: 'success',
      url: 'https://t.me/VerifiedModels_VIP'
    }
  ]);

  const webAppUrl = process.env.WEBAPP_URL || 'https://galeria-verifiedmodels.pages.dev';
  keyboard.push([
    {
      text: '🔵 WebApp',
      style: 'primary',
      web_app: { url: webAppUrl }
    }
  ]);

  keyboard.push([
    {
      text: '🔴 Volver',
      style: 'danger',
      callback_data: 'inicio'
    },
    {
      text: '🔴 Inicio',
      style: 'danger',
      callback_data: 'inicio'
    }
  ]);

  const texto = '👑 GALERÍA\\nElige una chica 👇';

  try {
    return await ctx.reply(texto, {
      reply_markup: {
        inline_keyboard: keyboard
      }
    });
  } catch (e) {
    console.error('LISTA: Telegram rechazó el teclado/lista:', e);
    return ctx.reply('❌ No pude mostrar la lista de modelos. Revisa los logs de Render.');
  }
}
async function sendModelo(ctx, id) {
  const model = await getModelo(id);

  if (!model) {
    return ctx.reply('❌ Modelo no existe');
  }

  let config = {};
  try { config = await getConfig(); } catch (e) { console.error('MODELO: error cargando config:', e.message || e); }
  let plantilla = config.plantilla_texto ||
    '👑 {perfil} 👑\n@{username}\n{edad} | {nacionalidad}\n\n{Lista_servicios}\n\n{descripcion}\n\n{Votos} votos | {porcentaje_buenos}% buenos';
  let plantillaRich = null;

  // Si existe una plantilla activa, esta tiene prioridad y permite
  // intercambiar el estilo sin tocar cada modelo.
  if (config.plantilla_activa) {
    try {
      const { getPlantillas } = require('../config/db');
      const plantillas = await getPlantillas();
      const active = plantillas[config.plantilla_activa];
      if (active?.rich_message?.blocks?.length) plantillaRich = active.rich_message.blocks;
      else if (active?.texto) plantilla = active.texto;
    } catch (e) {
      console.error('MODELO: error cargando plantilla activa:', e.message || e);
    }
  }

  const rich = Array.isArray(plantillaRich) || esRichMessage(plantilla);
  const texto = replaceVars(plantilla, ctx, model, { rich });
  // Las plantillas pueden llegar en HTML, MarkdownV2, texto plano o Rich Messages.
  // No forzamos HTML: Telegram rechazaba algunas plantillas y terminaba
  // mostrando el mensaje genérico "No pude abrir esta modelo".
  const formato = prepararTextoTelegram(texto, []);
  const media = await getModelBotMedia(id);
  const fileId = media?.file_id;

  const baseWebAppUrl = String(process.env.WEBAPP_URL || 'https://galeria-verifiedmodels.pages.dev').replace(/\/$/, '');
  const perfilWebAppUrl = baseWebAppUrl + '?startapp=m_' + encodeURIComponent(id);

  const buttons = [
    [await webAppButton('perfil_webapp', perfilWebAppUrl, { section: 'plantilla', style: 'primary' })],
    [
      await button('votosbueno', { section: 'plantilla', callback_data: 'voto_bueno:' + id, style: 'success' }),
      await button('votosmalos', { section: 'plantilla', callback_data: 'voto_malo:' + id, style: 'danger' })
    ]
  ];

  const normalizeTelegramUrl = value => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (/^t\.me\//i.test(raw)) return 'https://' + raw;
    if (/^@?[A-Za-z0-9_]{3,64}$/.test(raw)) return 'https://t.me/' + raw.replace(/^@/, '');
    return '';
  };
  const canalUrlModel = normalizeTelegramUrl(model.canalFree || model.canal_free || process.env.CANAL_FREE_URL);
  const contactoUrlModel = normalizeTelegramUrl(model.contacto) ||
    normalizeTelegramUrl(model.username);
  const contactRow = [];
  if (canalUrlModel) contactRow.push(await urlButton('canal_free', canalUrlModel, { section: 'plantilla', style: 'primary' }));
  if (contactoUrlModel) contactRow.push(await urlButton('contactar', contactoUrlModel, { section: 'plantilla', style: 'primary' }));
  if (contactRow.length) buttons.push(contactRow);

  buttons.push([
    await button('volver', { section: 'plantilla', callback_data: 'public_modelos', style: 'primary' }),
    await button('inicio', { section: 'plantilla', callback_data: 'inicio', style: 'primary' })
  ]);

  const markup = Markup.inlineKeyboard(buttons);

  // Telegram Bot API 10.1+ permite Rich Messages (artículos enriquecidos).
  // Los RichHTML se envían mediante sendRichMessage y conservan listas,
  // encabezados, citas, tablas, divisores, detalles y demás bloques.
  if (rich) {
    try {
      let richMessage;
      if (Array.isArray(plantillaRich)) {
        richMessage = { blocks: replaceVarsInRich(plantillaRich, ctx, model, { rich: true }) };
      } else {
        let richHtml = String(texto || '');
        const hasPhotoTag = /<img\s+[^>]*src=["']tg:\/\/photo\?id=model_photo["'][^>]*>/i.test(richHtml);
        if (fileId && !hasPhotoTag) richHtml = '<img src="tg://photo?id=model_photo">' + richHtml;
        richMessage = { html: richHtml };
      }
      if (fileId && richMessage.html) {
        richMessage.media = [{ id: 'model_photo', media: { type: 'photo', media: fileId } }];
      }
      return await ctx.telegram.callApi('sendRichMessage', {
        chat_id: ctx.chat.id,
        rich_message: richMessage,
        reply_markup: markup.reply_markup
      });
    } catch (e) {
      console.error('MODELO: Rich Message rechazado:', e.message || e);
      // Fallback al envío clásico para no impedir que se abra el perfil.
    }
  }

  if (fileId) {
    // Telegram limita el caption de una foto a 1024 caracteres.
    // Priorizamos siempre foto + texto en UN SOLO mensaje.
    const caption = String(formato.text || '').slice(0, 1024);
    try {
      return await ctx.replyWithPhoto(fileId, {
        caption,
        ...(formato.parse_mode ? { parse_mode: formato.parse_mode } : {}),
        ...markup
      });
    } catch (e) {
      console.error('MODELO: caption rechazado', formato.formato, ':', e.message || e);
      // Segundo intento: texto plano, pero conservando foto + caption + botones.
      // Así nunca se separa la foto del perfil por un problema de formato.
      try {
        const plainCaption = String(texto || '')
          .replace(/<tg-emoji[^>]*>([\s\S]*?)<\/tg-emoji>/gi, '$1')
          .replace(/<[^>]+>/g, '')
          .slice(0, 1024);
        return await ctx.replyWithPhoto(fileId, {
          caption: plainCaption,
          ...markup
        });
      } catch (fallbackError) {
        console.error('MODELO: no se pudo enviar foto + caption:', fallbackError.message || fallbackError);
        return ctx.reply(String(texto || '').slice(0, 4096), markup);
      }
    }
  }

  try {
    return await ctx.reply(texto, {
      ...(formato.parse_mode ? { parse_mode: formato.parse_mode } : {}),
      ...markup
    });
  } catch (e) {
    console.error('MODELO: error enviando texto con formato', formato.formato, ':', e.message || e);
    // Último recurso: texto plano para que el perfil siempre pueda abrirse.
    return ctx.reply(String(texto).replace(/<[^>]*>/g, ''), markup);
  }
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
    const id = ctx.match[1];

    await ctx.answerCbQuery().catch(() => {});

    try {
      await ctx.deleteMessage().catch(() => {});
      return await sendModelo(ctx, id);
    } catch (e) {
      console.error('MODELO: error al abrir modelo desde la lista:', id, e);
      return ctx.reply('❌ No pude abrir esta modelo. Revisa los logs de Render.');
    }
  });

  bot.command('foto_modelo', async ctx => {
    if (!await isAdmin(ctx.from?.id)) return ctx.reply('❌ Sin permiso.');
    const id = String(ctx.message.text || '').trim().split(/\s+/)[1];
    if (!id) return ctx.reply('❌ Usa: <code>/foto_modelo ID</code>', { parse_mode:'HTML' });
    const model = await getModelo(id);
    if (!model) return ctx.reply('❌ Modelo no encontrada.');
    global.__modelPhotoPending = global.__modelPhotoPending || new Map();
    global.__modelPhotoPending.set(String(ctx.from.id), id);
    return ctx.reply('📸 Ahora envía la foto de <b>' + escapeHtml(model.perfil || id) + '</b>.', {parse_mode:'HTML'});
  });

  bot.on(['photo','document'], async ctx => {
    if (!await isAdmin(ctx.from?.id)) return;
    const caption = String(ctx.message.caption || '').trim();
    const match = caption.match(/^\/foto_modelo(?:\s+|$)(\S+)/i);
    const pending = global.__modelPhotoPending?.get(String(ctx.from?.id));
    const id = match?.[1] || pending;
    if (!id) return;
    try {
      const model = await getModelo(id);
      if (!model) return ctx.reply('❌ Modelo no encontrada.');
      const fileId = ctx.message.photo?.at(-1)?.file_id || ctx.message.document?.file_id;
      if (!fileId) return ctx.reply('❌ No pude obtener el file_id.');
      const oldMedia = await getModelBotMedia(id);
      if (oldMedia?.message_id) await deleteStorageMessage(ctx.telegram, oldMedia);
      const published = await publishModelPhoto(ctx.telegram, id, fileId, '💃 ' + String(model.perfil || id));
      await saveModelBotMedia(id, published);
      global.__modelPhotoPending?.delete(String(ctx.from.id));
      return ctx.reply('✅ Foto de <b>' + escapeHtml(model.perfil || id) + '</b> actualizada.\n🆔 file_id: <code>' + escapeHtml(published.file_id) + '</code>\n📦 Topic 💃 MODELOS: mensaje <code>' + published.message_id + '</code>', {parse_mode:'HTML'});
    } catch(e) {
      console.error('MODELOS: error guardando foto:',e);
      return ctx.reply('❌ No pude guardar la foto: ' + escapeHtml(e.message || 'error'), {parse_mode:'HTML'});
    }
  });

  bot.action(/^voto_(bueno|malo):(.+)$/, async ctx => {
    try {
      const type = ctx.match[1];
      const id = ctx.match[2];
      const result = await voteModelo(id, type, String(ctx.from?.id || ''));
      if (!result.registered) {
        await ctx.answerCbQuery('Ya votaste por esta modelo', { show_alert: true });
        return;
      }
      const n = result.count;
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
registerModelos.setPhotoPending = (userId, modelId) => {
  global.__modelPhotoPending = global.__modelPhotoPending || new Map();
  global.__modelPhotoPending.set(String(userId), String(modelId));
};
registerModelos.sendModelo = sendModelo;

module.exports = registerModelos;
