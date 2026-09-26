const { isAdmin, slugify, escapeHtml, textoConPremiumToHtml, prepararTextoTelegram } = require('../utils');
const {
  saveConfig, getConfig, getPlantillas, savePlantilla, deletePlantilla,
  getBotMedia, saveBotMedia, getModelo, saveModelBotMedia
} = require('../config/db');
const { publishPhotoToStorage, publishModelPhoto, publishTemplatePhoto, publishTextToStorage } = require('../storage');

const { setPending, getPending, clearPending } = require('../pending');

function normalizeTemplate(name, text, entities = []) {
  const id = slugify(name);
  const converted = textoConPremiumToHtml(text, entities);
  const detected = prepararTextoTelegram(text, entities);
  return {
    id, nombre: String(name).trim(), texto: converted.html,
    texto_original: String(text), entities: Array.isArray(entities) ? entities : [],
    premium_emoji_ids: converted.ids,
    formato: detected.formato,
    parse_mode: converted.ids.length ? 'HTML' : (detected.parse_mode || null),
    actualizado: new Date().toISOString()
  };
}

async function publishTemplate(telegram, template, action = 'CREADA') {
  const header = '📝 PLANTILLA ' + action + '\nID: ' + template.id + '\nNombre: ' + template.nombre +
    '\nFormato: ' + template.formato + (template.premium_emoji_ids.length ? '\n💎 Emojis Premium: ' + template.premium_emoji_ids.join(', ') : '');
  return publishTextToStorage(telegram, 'plantillas', header + '\n\n' + template.texto, { parse_mode: 'HTML' });
}

module.exports = bot => {
  bot.command('bienvenida', async ctx => {
    if (!await isAdmin(ctx.from.id)) return;
    const t = ctx.message.text.replace(/^\/bienvenida\s*/,'').trim();
    if (!t) return ctx.reply('Uso: /bienvenida texto con {mencion} 💎');
    await saveConfig({ bienvenida_texto: t });
    return ctx.reply('✅ Texto de bienvenida guardado.');
  });

  bot.command('plantilla', async ctx => {
    if (!await isAdmin(ctx.from.id)) return;
    const a = ctx.message.text.replace(/^\/plantilla\s*/,'').split('|');
    if (a.length < 2) return ctx.reply('Uso: /plantilla Nombre | Texto con {perfil} {username} {edad} {nacionalidad} {Lista_servicios} {descripcion} {votosBueno} {votosMalo} {total_votos} {canal_free} {contacto}');
    const name = a.shift().trim(), text = a.join('|').trim();
    const t = normalizeTemplate(name, text, ctx.message.entities || []);
    setPending(ctx.from.id, { type:'template_confirm', template:t });
    return ctx.reply(
      '👁️ <b>VISTA PREVIA</b>\\n\\n' + t.texto +
      '\\n\\n🆔 <code>' + escapeHtml(t.id) + '</code> · ' + escapeHtml(t.formato) +
      '\\n💎 Premium: ' + (t.premium_emoji_ids.length ? '✅' : '❌') +
      '\\n\\nEscribe <code>CONFIRMAR</code> para guardar o <code>/cancel</code> para cancelar.',
      { parse_mode:'HTML' }
    );
  });

  bot.command('plantilla_usar', async ctx => {
    if (!await isAdmin(ctx.from.id)) return;
    const id = ctx.message.text.replace(/^\/plantilla_usar\s*/i,'').trim();
    if (!id) return ctx.reply('Uso: /plantilla_usar ID');
    const p = await getPlantillas();
    if (!p[id]) return ctx.reply('❌ Plantilla inexistente. Usa /plantillas.');
    await saveConfig({ plantilla_activa:id, plantilla_texto:p[id].texto||'' });
    try { await publishTextToStorage(ctx.telegram,'plantillas','🔄 PLANTILLA ACTIVA\\nID: '+id+'\\nNombre: '+String(p[id].nombre||id),{}); } catch(e) { console.error('PLANTILLA_USAR:',e.message||e); }
    return ctx.reply('✅ Plantilla activa: <b>'+escapeHtml(p[id].nombre||id)+'</b>\\n🆔 <code>'+escapeHtml(id)+'</code>',{parse_mode:'HTML'});
  });

  bot.command('plantilla_actual', async ctx => {
    if (!await isAdmin(ctx.from.id)) return;
    const c=await getConfig();
    return ctx.reply('📝 Plantilla activa: <code>'+escapeHtml(c.plantilla_activa||'predeterminada')+'</code>',{parse_mode:'HTML'});
  });

  bot.command('delplantilla', async ctx => {
    if (!await isAdmin(ctx.from.id)) return;
    const id=ctx.message.text.replace(/^\/delplantilla\s*/,'').trim();
    if(!id) return ctx.reply('Uso: /delplantilla ID');
    await deletePlantilla(id);
    clearPending(ctx.from.id);
    return ctx.reply('🗑️ Plantilla eliminada: <code>'+escapeHtml(id)+'</code>.',{parse_mode:'HTML'});
  });

  bot.command('plantillas', async ctx => {
    if (!await isAdmin(ctx.from.id)) return;
    const p=await getPlantillas();
    const rows=Object.keys(p).map(id=>'• <code>'+escapeHtml(id)+'</code> — '+escapeHtml(p[id].nombre||id)+' · '+escapeHtml(p[id].formato||'plain'));
    return ctx.reply('💎 <b>PLANTILLAS</b>\\n\\n'+(rows.join('\\n')||'Sin plantillas'),{parse_mode:'HTML'});
  });

  bot.on(['photo','document'], async (ctx,next) => {
    if (!await isAdmin(ctx.from.id)) return next();
    const p=ctx.message.photo?.at(-1), c=String(ctx.message.caption||'').trim();
    const fileId=p?.file_id||ctx.message.document?.file_id;
    if(!fileId) return next();
    try {
      if(c==='/bienvenida'){ const r=await publishPhotoToStorage(ctx.telegram,'bienvenida',fileId,'👋 BIENVENIDA'); await saveBotMedia('bienvenida',r.fileId); return ctx.reply('✅ Bienvenida guardada en 📦 Telegram Storage.'); }
      if(c==='/galeria'){ const r=await publishPhotoToStorage(ctx.telegram,'galeria',fileId,'🖼️ GALERÍA'); await saveBotMedia('galeria',r.fileId); return ctx.reply('✅ Galería guardada en 📦 Telegram Storage.'); }
      const x=c.match(/^\/plantilla_foto\s+(.+)$/i);
      if(x){ const id=slugify(x[1]), q=await getPlantillas(); if(!q[id]) return ctx.reply('❌ Plantilla inexistente.'); const r=await publishTemplatePhoto(ctx.telegram,id,fileId,'📝 FOTO PLANTILLA: '+id); return ctx.reply('✅ Foto de plantilla <b>'+escapeHtml(q[id].nombre||id)+'</b> guardada en 📦 Telegram Storage.',{parse_mode:'HTML'}); }
      const y=c.match(/^\/foto_modelo\s+(.+)$/i);
      if(y){ const id=y[1].trim(), model=await getModelo(id); if(!model)return ctx.reply('❌ Modelo inexistente en Firebase.'); const r=await publishModelPhoto(ctx.telegram,id,fileId,'💃 MODELO ID: '+id); await saveModelBotMedia(id,{file_id:r.fileId,message_id:r.message.message_id,message_thread_id:r.message.message_thread_id}); return ctx.reply('✅ Foto del bot guardada para '+escapeHtml(model.perfil||model.username||id)+' en 📦 Telegram Storage.',{parse_mode:'HTML'}); }
    } catch(e) { console.error('Error guardando media:',e); return ctx.reply('❌ No pude guardar la foto. Revisa los temas vinculados y permisos del bot.'); }
    return next();
  });

  bot.command('media', async ctx => {
    if(!await isAdmin(ctx.from.id))return;
    const m=await getBotMedia();
    return ctx.reply('📸 <b>MEDIA TELEGRAM</b>\\n👋 Bienvenida: '+(m.bienvenida?'✅':'❌')+'\\n🖼️ Galería: '+(m.galeria?'✅':'❌')+'\\n\\n/plantilla_foto ID + foto\\n/bienvenida + foto\\n/galeria + foto\\n/foto_modelo ID + foto',{parse_mode:'HTML'});
  });
};
